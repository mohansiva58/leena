import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StockReservationService } from '../services/StockReservationService';
import { InventoryAuditService } from '../services/InventoryAuditService';

interface ReserveItem {
    productId: string;
    size: string;
    quantity: number;
    color?: string;
}

export const reserveStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { items, sessionId } = req.body as {
            items?: ReserveItem[];
            sessionId?: string;
        };

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Items array is required' });
            return;
        }
        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        const userId = (req as AuthRequest).user?.uid;

        const reservations = await StockReservationService.reserveCartItems(
            items,
            sessionId,
            userId
        );

        res.status(201).json({
            success: true,
            reservations,
            expiresAt: reservations[0]?.expiresAt,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Reservation failed';
        res.status(409).json({ error: errorMessage });
    }
};

export const releaseStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reservationId } = req.body as { reservationId?: string };

        if (!reservationId) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        const ok = await StockReservationService.releaseStock(reservationId, 'manual_release');
        res.status(200).json({ success: ok, message: ok ? 'Stock released' : 'Reservation not found' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Release failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const confirmReservation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reservationId } = req.body as { reservationId?: string };

        if (!reservationId) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        const ok = await StockReservationService.completeReservation(reservationId);
        res.status(200).json({ success: ok, message: ok ? 'Reservation confirmed' : 'Reservation expired or not found' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Confirmation failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const refreshReservation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { reservationId } = req.body as { reservationId?: string };

        if (!reservationId) {
            res.status(400).json({ error: 'Reservation ID is required' });
            return;
        }

        const ok = await StockReservationService.refreshReservation(reservationId);
        res.status(200).json({ success: ok, message: ok ? 'Reservation refreshed' : 'Reservation not found or expired' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const refreshAllReservations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.body as { sessionId?: string };

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        const count = await StockReservationService.refreshSessionReservations(sessionId);
        res.status(200).json({ success: true, refreshed: count });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const releaseAllForSession = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sessionId } = req.body as { sessionId?: string };

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        const count = await StockReservationService.releaseAllForSession(sessionId, 'manual_release');
        res.status(200).json({ success: true, released: count });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Release failed';
        res.status(500).json({ error: errorMessage });
    }
};

export const getProductStock = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const productId = Array.isArray(id) ? id[0] : id;
        const stock = await StockReservationService.getStockForProduct(productId);
        if (!stock) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(stock);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock';
        res.status(500).json({ error: errorMessage });
    }
};

export const getAuditHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId: rawProductId } = req.params;
        const productId = Array.isArray(rawProductId) ? rawProductId[0] : rawProductId;
        const { limit, offset, eventType } = req.query;
        const result = await InventoryAuditService.getProductHistory(productId, {
            limit: limit ? Number(limit) : 50,
            offset: offset ? Number(offset) : 0,
            eventType: eventType as any,
        });
        res.json(result);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit history';
        res.status(500).json({ error: errorMessage });
    }
};
