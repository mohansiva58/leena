import Product from '../models/Product';
import StockReservation, { IStockReservation } from '../models/StockReservation';
import { generateOrderId } from '../utils/helpers';
import mongoose from 'mongoose';
import { getIO } from '../socket';

export class StockReservationService {
    /**
     * Reserve stock for a specific product size.
     * Uses atomic updates to prevent overselling.
     */
    static async reserveStock(
        productId: string,
        size: string,
        quantity: number,
        sessionId: string,
        userId?: string
    ): Promise<IStockReservation> {
        // 0. Check if this session already has a valid reservation for this product/size
        const existing = await StockReservation.findOne({
            productId,
            size,
            sessionId,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (existing) {
            // If the quantity is the same, just return it. 
            // If different, we'd need to adjust, but for now let's just return existing.
            return existing;
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Find the product and check if enough AVAILABLE stock exists
            // available = total - reserved
            const product = await Product.findOne({ productId }).session(session);
            if (!product) throw new Error('Product not found');

            // sizeCounts is a Mongoose Map at runtime — access safely
            const sizeCountsMap = product.sizeCounts as unknown as Map<string, number> | Record<string, number> | undefined;
            const reservedCountsMap = product.sizeReservedCounts as unknown as Map<string, number> | Record<string, number> | undefined;

            const currentStock = sizeCountsMap instanceof Map
                ? (sizeCountsMap.get(size) || 0)
                : Number((sizeCountsMap as Record<string, number> | undefined)?.[size] || 0);
            const reservedStock = reservedCountsMap instanceof Map
                ? (reservedCountsMap.get(size) || 0)
                : Number((reservedCountsMap as Record<string, number> | undefined)?.[size] || 0);
            const availableStock = currentStock - reservedStock;

            if (availableStock < quantity) {
                throw new Error(`Insufficient stock. Only ${availableStock} available.`);
            }

            // 2. Atomically increment the reserved count
            await Product.updateOne(
                { productId },
                { $inc: { [`sizeReservedCounts.${size}`]: quantity } },
                { session }
            );

            // 3. Create the reservation record
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
            const reservation = await StockReservation.create([{
                reservationId: generateOrderId(),
                productId,
                size,
                quantity,
                userId,
                sessionId,
                status: 'reserved',
                expiresAt,
            }], { session });

            await session.commitTransaction();
            
            // 4. Notify all clients about the stock change
            this.broadcastStockUpdate(productId, size);

            return reservation[0];
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Release a reservation (e.g., payment failed or expired).
     */
    static async releaseStock(reservationId: string): Promise<void> {
        const reservation = await StockReservation.findOne({ reservationId, status: 'reserved' });
        if (!reservation) return;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Decrement the reserved count
            await Product.updateOne(
                { productId: reservation.productId },
                { $inc: { [`sizeReservedCounts.${reservation.size}`]: -reservation.quantity } },
                { session }
            );

            // 2. Mark reservation as released
            reservation.status = 'released';
            await reservation.save({ session });

            await session.commitTransaction();

            // 3. Notify clients
            this.broadcastStockUpdate(reservation.productId, reservation.size);
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Complete a reservation (payment success).
     * Converts reserved stock to actual deducted stock.
     */
    static async completeReservation(reservationId: string): Promise<boolean> {
        const reservation = await StockReservation.findOne({ reservationId, status: 'reserved' });
        if (!reservation) return false;

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Deduct from total stock AND decrement from reserved count
            await Product.updateOne(
                { productId: reservation.productId },
                { 
                    $inc: { 
                        [`sizeCounts.${reservation.size}`]: -reservation.quantity,
                        [`sizeReservedCounts.${reservation.size}`]: -reservation.quantity,
                        stock: -reservation.quantity
                    } 
                },
                { session }
            );

            // 2. Mark reservation as completed
            reservation.status = 'completed';
            await reservation.save({ session });

            await session.commitTransaction();

            // 3. Notify clients
            this.broadcastStockUpdate(reservation.productId, reservation.size);
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Cleanup expired reservations.
     */
    static async cleanupExpiredReservations(): Promise<void> {
        const expired = await StockReservation.find({
            status: 'reserved',
            expiresAt: { $lt: new Date() }
        });

        for (const res of expired) {
            try {
                await this.releaseStock(res.reservationId);
                console.log(`Released expired reservation: ${res.reservationId}`);
            } catch (err) {
                console.error(`Failed to release reservation ${res.reservationId}:`, err);
            }
        }
    }

    static async broadcastStockUpdate(productId: string, size?: string) {
        const product = await Product.findOne({ productId });
        if (!product) return;

        const io = getIO();
        if (!io) return;

        // Build per-size available stock map — sizeCounts is a Mongoose Map at runtime
        const sizeCountsRaw = product.sizeCounts as unknown as Map<string, number> | Record<string, number> | undefined;
        const reservedRaw = product.sizeReservedCounts as unknown as Map<string, number> | Record<string, number> | undefined;

        const getSizeCount = (map: Map<string, number> | Record<string, number> | undefined, s: string): number => {
            if (!map) return 0;
            if (map instanceof Map) return map.get(s) || 0;
            return Number((map as Record<string, number>)[s] || 0);
        };

        const keys: string[] = sizeCountsRaw instanceof Map
            ? Array.from(sizeCountsRaw.keys())
            : sizeCountsRaw ? Object.keys(sizeCountsRaw) : [];

        const sizesToBroadcast: string[] = size ? [size] : keys;

        for (const s of sizesToBroadcast) {
            const total = getSizeCount(sizeCountsRaw, s);
            const reserved = getSizeCount(reservedRaw, s);
            const available = Math.max(0, total - reserved);

            io.emit('stockUpdate', {
                productId,
                size: s,
                stock: available,
            });
        }
    }

}
