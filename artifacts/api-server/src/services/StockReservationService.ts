import Product from '../models/Product';
import StockReservation, { IStockReservation } from '../models/StockReservation';
import { generateOrderId } from '../utils/helpers';
import mongoose from 'mongoose';
import { getIO } from '../socket';
import { InventoryAuditService } from './InventoryAuditService';

const RESERVATION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface ReservationItem {
    productId: string;
    size: string;
    quantity: number;
    color?: string;
}

export interface ReservationResult {
    reservationId: string;
    productId: string;
    size: string;
    quantity: number;
    expiresAt: Date;
}

export class StockReservationService {
    /**
     * Reserve stock for a specific product size.
     * Handles quantity changes (release old + reserve new).
     * Uses atomic updates to prevent overselling.
     */
    static async reserveStock(
        productId: string,
        size: string,
        quantity: number,
        sessionId: string,
        userId?: string,
        color?: string
    ): Promise<IStockReservation> {
        // 0. Check if this session already has a valid reservation for this product/size/color
        const existing = await StockReservation.findOne({
            productId,
            size,
            sessionId,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (existing) {
            // If quantity changed, release old and reserve new
            if (existing.quantity !== quantity) {
                await this.releaseStock(existing.reservationId, 'quantity_changed');
                // Continue to create new reservation below
            } else {
                // Same quantity, just refresh TTL
                existing.expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
                await existing.save();
                return existing;
            }
        }

        let previousStock = 0;
        let previousReserved = 0;

        // 1. Find the product and check if enough AVAILABLE stock exists
        const product = await Product.findOne({ productId });
        if (!product) throw new Error('Product not found');

        const sizeCountsMap = product.sizeCounts as unknown as Map<string, number> | Record<string, number> | undefined;
        const reservedCountsMap = product.sizeReservedCounts as unknown as Map<string, number> | Record<string, number> | undefined;

        const currentStock = sizeCountsMap instanceof Map
            ? (sizeCountsMap.get(size) || 0)
            : Number((sizeCountsMap as Record<string, number> | undefined)?.[size] || 0);
        const reservedStock = reservedCountsMap instanceof Map
            ? (reservedCountsMap.get(size) || 0)
            : Number((reservedCountsMap as Record<string, number> | undefined)?.[size] || 0);
        const availableStock = currentStock - reservedStock;

        previousStock = currentStock;
        previousReserved = reservedStock;

        if (availableStock < quantity) {
            throw new Error(`Insufficient stock. Only ${availableStock} available.`);
        }

        // 2. Atomically increment the reserved count (no transaction needed for single-document atomic update)
        const updateResult = await Product.updateOne(
            { productId },
            { $inc: { [`sizeReservedCounts.${size}`]: quantity } }
        );

        if (updateResult.matchedCount === 0) {
            throw new Error('Product not found during stock update');
        }

        // 3. Create the reservation record
        const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
        let reservation: IStockReservation;
        try {
            reservation = await StockReservation.create({
                reservationId: generateOrderId(),
                productId,
                size,
                quantity,
                userId,
                sessionId,
                color,
                status: 'reserved',
                expiresAt,
            });
        } catch (err) {
            // Rollback: decrement reserved count if reservation creation fails
            await Product.updateOne(
                { productId },
                { $inc: { [`sizeReservedCounts.${size}`]: -quantity } }
            );
            throw err;
        }

        // 4. Audit log
        InventoryAuditService.logEvent({
            productId,
            size,
            color,
            quantity,
            eventType: 'reserved',
            reservationId: reservation.reservationId,
            userId,
            sessionId,
            previousStock,
            newStock: previousStock,
            previousReserved,
            newReserved: previousReserved + quantity,
            reason: 'checkout reservation',
        });

        // 5. Notify all clients about the stock change
        this.broadcastStockUpdate(productId, size);

        return reservation;
    }

    /**
     * Reserve stock for multiple items (cart checkout).
     * Returns all reservations or throws if any item is unavailable.
     * All-or-nothing semantics.
     */
    static async reserveCartItems(
        items: ReservationItem[],
        sessionId: string,
        userId?: string
    ): Promise<ReservationResult[]> {
        const reservations: ReservationResult[] = [];

        try {
            for (const item of items) {
                const reservation = await this.reserveStock(
                    item.productId,
                    item.size,
                    item.quantity,
                    sessionId,
                    userId,
                    item.color
                );
                reservations.push({
                    reservationId: reservation.reservationId,
                    productId: reservation.productId,
                    size: reservation.size,
                    quantity: reservation.quantity,
                    expiresAt: reservation.expiresAt,
                });
            }
            return reservations;
        } catch (error) {
            // Rollback: release any reservations we already made
            for (const res of reservations) {
                await this.releaseStock(res.reservationId, 'partial_rollback').catch(() => undefined);
            }
            throw error;
        }
    }

    /**
     * Release a reservation (e.g., payment failed or expired).
     * Idempotent: safe to call multiple times.
     */
    static async releaseStock(
        reservationId: string,
        reason: string = 'manual_release'
    ): Promise<boolean> {
        const reservation = await StockReservation.findOne({ reservationId });
        if (!reservation) return false;

        // Idempotent: already released or completed
        if (reservation.status !== 'reserved') {
            return true;
        }

        try {
            // 1. Decrement the reserved count (atomic single-document update)
            await Product.updateOne(
                { productId: reservation.productId },
                {
                    $inc: {
                        [`sizeReservedCounts.${reservation.size}`]: -Math.abs(reservation.quantity)
                    }
                }
            );

            // 2. Mark reservation as released
            reservation.status = 'released';
            await reservation.save();

            // 3. Audit log
            InventoryAuditService.logEvent({
                productId: reservation.productId,
                size: reservation.size,
                color: reservation.color,
                quantity: reservation.quantity,
                eventType: 'released',
                reservationId: reservation.reservationId,
                userId: reservation.userId,
                sessionId: reservation.sessionId,
                reason,
            });

            // 4. Notify clients
            this.broadcastStockUpdate(reservation.productId, reservation.size);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Complete a reservation (payment success).
     * Converts reserved stock to actual deducted stock.
     * Checks expiry before completing.
     */
    static async completeReservation(reservationId: string): Promise<boolean> {
        const reservation = await StockReservation.findOne({ reservationId });
        if (!reservation) return false;

        // Idempotent: already completed
        if (reservation.status === 'completed') return true;

        // Cannot complete if already released or expired
        if (reservation.status !== 'reserved') return false;

        // Check if expired
        if (reservation.expiresAt < new Date()) {
            // Auto-release expired reservation
            await this.releaseStock(reservationId, 'expired_on_complete');
            return false;
        }

        try {
            // 1. Deduct from total stock AND decrement from reserved count (atomic single-document update)
            await Product.updateOne(
                { productId: reservation.productId },
                {
                    $inc: {
                        [`sizeCounts.${reservation.size}`]: -Math.abs(reservation.quantity),
                        [`sizeReservedCounts.${reservation.size}`]: -Math.abs(reservation.quantity),
                        stock: -Math.abs(reservation.quantity)
                    }
                }
            );

            // 2. Mark reservation as completed
            reservation.status = 'completed';
            await reservation.save();

            // 3. Audit log
            InventoryAuditService.logEvent({
                productId: reservation.productId,
                size: reservation.size,
                color: reservation.color,
                quantity: reservation.quantity,
                eventType: 'completed',
                reservationId: reservation.reservationId,
                userId: reservation.userId,
                sessionId: reservation.sessionId,
                reason: 'payment successful',
            });

            // 4. Notify clients
            this.broadcastStockUpdate(reservation.productId, reservation.size);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Refresh a reservation's TTL (extend expiry time).
     * Useful for keeping reservation alive during checkout.
     */
    static async refreshReservation(reservationId: string): Promise<boolean> {
        const reservation = await StockReservation.findOne({
            reservationId,
            status: 'reserved',
            expiresAt: { $gt: new Date() }
        });

        if (!reservation) return false;

        reservation.expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
        await reservation.save();
        return true;
    }

    /**
     * Refresh all reservations for a session.
     */
    static async refreshSessionReservations(sessionId: string): Promise<number> {
        const result = await StockReservation.updateMany(
            {
                sessionId,
                status: 'reserved',
                expiresAt: { $gt: new Date() }
            },
            { expiresAt: new Date(Date.now() + RESERVATION_TTL_MS) }
        );
        return result.modifiedCount;
    }

    /**
     * Release all reservations for a session.
     */
    static async releaseAllForSession(sessionId: string, reason: string = 'session_end'): Promise<number> {
        const reservations = await StockReservation.find({
            sessionId,
            status: 'reserved'
        });

        let released = 0;
        for (const res of reservations) {
            const ok = await this.releaseStock(res.reservationId, reason).catch(() => false);
            if (ok) released++;
        }
        return released;
    }

    /**
     * Cleanup expired reservations.
     * Called periodically by a background job.
     */
    static async cleanupExpiredReservations(): Promise<number> {
        const expired = await StockReservation.find({
            status: 'reserved',
            expiresAt: { $lt: new Date() }
        });

        let released = 0;
        for (const res of expired) {
            try {
                const ok = await this.releaseStock(res.reservationId, 'expired');
                if (ok) {
                    res.status = 'expired';
                    await res.save();
                    released++;

                    InventoryAuditService.logEvent({
                        productId: res.productId,
                        size: res.size,
                        color: res.color,
                        quantity: res.quantity,
                        eventType: 'expired',
                        reservationId: res.reservationId,
                        userId: res.userId,
                        sessionId: res.sessionId,
                        reason: 'reservation TTL expired',
                    });
                }
            } catch (err) {
                console.error(`[StockReservation] Failed to release expired reservation ${res.reservationId}:`, err);
            }
        }

        if (released > 0) {
            console.log(`[StockReservation] Cleaned up ${released} expired reservations`);
        }
        return released;
    }

    /**
     * Get real-time stock for a product.
     */
    static async getStockForProduct(productId: string): Promise<{
        productId: string;
        sizes: Record<string, { total: number; reserved: number; available: number }>;
        totalStock: number;
        totalReserved: number;
        totalAvailable: number;
    } | null> {
        const product = await Product.findOne({ productId }).lean();
        if (!product) return null;

        const sizeCountsMap = product.sizeCounts as unknown as Map<string, number> | Record<string, number> | undefined;
        const reservedCountsMap = product.sizeReservedCounts as unknown as Map<string, number> | Record<string, number> | undefined;

        const getCount = (map: Map<string, number> | Record<string, number> | undefined, s: string): number => {
            if (!map) return 0;
            if (map instanceof Map) return map.get(s) || 0;
            return Number((map as Record<string, number>)[s] || 0);
        };

        const sizes: Record<string, { total: number; reserved: number; available: number }> = {};
        let totalStock = 0;
        let totalReserved = 0;

        const keys = sizeCountsMap instanceof Map
            ? Array.from(sizeCountsMap.keys())
            : sizeCountsMap ? Object.keys(sizeCountsMap) : [];

        for (const size of keys) {
            const total = getCount(sizeCountsMap, size);
            const reserved = getCount(reservedCountsMap, size);
            const available = Math.max(0, total - reserved);
            sizes[size] = { total, reserved, available };
            totalStock += total;
            totalReserved += reserved;
        }

        return {
            productId,
            sizes,
            totalStock,
            totalReserved,
            totalAvailable: Math.max(0, totalStock - totalReserved),
        };
    }

    static async broadcastStockUpdate(productId: string, size?: string) {
        const product = await Product.findOne({ productId });
        if (!product) return;

        const io = getIO();
        if (!io) return;

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
                available,
                total,
                reserved,
            });
        }
    }
}
