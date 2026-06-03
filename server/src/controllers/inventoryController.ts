import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StockReservationService } from '../services/StockReservationService';

const normalizeReservationItems = (items: unknown) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
        const raw = item as Record<string, unknown>;
        return {
            productId: String(raw.productId || ''),
            size: String(raw.size || ''),
            color: raw.color ? String(raw.color) : undefined,
            quantity: Number(raw.quantity || 0),
        };
    }).filter((item) => item.productId && item.size && item.quantity > 0);
};

export const getProductStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const stock = await StockReservationService.getProductStock(String(req.params.id));
        res.json(stock);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch stock';
        res.status(message === 'Product not found' ? 404 : 500).json({ error: message });
    }
};

export const reserveInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid || req.body.userId;
        const { productId, size, quantity, sessionId, color, idempotencyKey } = req.body;
        const items = normalizeReservationItems(req.body.items);

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        if (items.length > 0) {
            const result = await StockReservationService.reserveItems(items, String(sessionId), userId, idempotencyKey);
            res.status(201).json(result);
            return;
        }

        if (!productId || !size || !quantity) {
            res.status(400).json({ error: 'Reservation item fields are required' });
            return;
        }

        const reservation = await StockReservationService.reserveStock(
            String(productId),
            String(size),
            Number(quantity),
            String(sessionId),
            userId,
            { color: color ? String(color) : undefined, idempotencyKey: idempotencyKey ? String(idempotencyKey) : undefined }
        );

        res.status(201).json({
            reservationGroupId: reservation.reservationGroupId,
            reservationIds: [reservation.reservationId],
            reservationId: reservation.reservationId,
            expiresAt: reservation.expiresAt,
            ttlSeconds: Math.max(0, Math.floor((reservation.expiresAt.getTime() - Date.now()) / 1000)),
            reservations: [reservation],
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Reservation failed';
        res.status(409).json({ error: message });
    }
};

export const releaseInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reservationId, reservationIds, reason } = req.body;
        const ids = Array.isArray(reservationIds) ? reservationIds : reservationId ? [reservationId] : [];

        if (ids.length === 0) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        await Promise.all(ids.map((id) => StockReservationService.releaseStock(String(id), reason || 'released')));
        res.json({ success: true, released: ids.length });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Release failed';
        res.status(500).json({ error: message });
    }
};

export const confirmInventory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { reservationId, reservationIds, orderId, paymentId } = req.body;
        const ids = Array.isArray(reservationIds) ? reservationIds : reservationId ? [reservationId] : [];

        if (ids.length === 0) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        for (const id of ids) {
            const confirmed = await StockReservationService.completeReservation(String(id), {
                orderId: orderId ? String(orderId) : undefined,
                paymentId: paymentId ? String(paymentId) : undefined,
            });
            if (!confirmed) {
                res.status(409).json({ error: `Reservation ${id} is not active` });
                return;
            }
        }

        res.json({ success: true, confirmed: ids.length });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Confirmation failed';
        res.status(500).json({ error: message });
    }
};

export const getCheckoutReservation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const reservation = await StockReservationService.getReservation(String(req.params.id), req.user?.uid);
        if (!reservation) {
            res.status(404).json({ error: 'Reservation not found' });
            return;
        }
        res.json({
            ...reservation,
            ttlSeconds: Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000)),
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch reservation';
        res.status(500).json({ error: message });
    }
};
