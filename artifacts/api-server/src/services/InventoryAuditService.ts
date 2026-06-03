import InventoryAuditLog from '../models/InventoryAuditLog';
import { generateOrderId } from '../utils/helpers';
import type { InventoryEventType } from '../models/InventoryAuditLog';

interface AuditLogParams {
    productId: string;
    size: string;
    color?: string;
    quantity: number;
    eventType: InventoryEventType;
    reservationId?: string;
    orderId?: string;
    userId?: string;
    sessionId?: string;
    previousStock?: number;
    newStock?: number;
    previousReserved?: number;
    newReserved?: number;
    reason?: string;
    metadata?: Record<string, unknown>;
}

export class InventoryAuditService {
    /**
     * Log an inventory event asynchronously (fire-and-forget).
     * Never blocks the critical path.
     */
    static logEvent(params: AuditLogParams): void {
        const eventId = `AUD-${generateOrderId()}`;
        // Fire-and-forget: don't await, don't block
        InventoryAuditLog.create({
            eventId,
            ...params,
        }).catch((err) => {
            console.error('[InventoryAudit] Failed to log event:', err);
        });
    }

    /**
     * Log an inventory event synchronously.
     * Use only in non-critical paths where you want to ensure the log is written.
     */
    static async logEventSync(params: AuditLogParams): Promise<void> {
        const eventId = `AUD-${generateOrderId()}`;
        await InventoryAuditLog.create({
            eventId,
            ...params,
        });
    }

    /**
     * Get audit history for a product.
     */
    static async getProductHistory(
        productId: string,
        options: { limit?: number; offset?: number; eventType?: InventoryEventType } = {}
    ) {
        const { limit = 50, offset = 0, eventType } = options;
        const query: Record<string, unknown> = { productId };
        if (eventType) query.eventType = eventType;

        const [logs, total] = await Promise.all([
            InventoryAuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            InventoryAuditLog.countDocuments(query),
        ]);

        return { logs, total, limit, offset };
    }
}
