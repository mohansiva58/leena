import mongoose, { Schema, Document } from 'mongoose';

export type InventoryEventType =
    | 'reserved'
    | 'released'
    | 'completed'
    | 'cancelled'
    | 'expired'
    | 'adjusted'
    | 'restocked';

export interface IInventoryAuditLog extends Document {
    eventId: string;
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
    createdAt: Date;
}

const InventoryAuditLogSchema: Schema = new Schema(
    {
        eventId: { type: String, required: true, unique: true, index: true },
        productId: { type: String, required: true, index: true },
        size: { type: String, required: true },
        color: { type: String },
        quantity: { type: Number, required: true, min: 0 },
        eventType: {
            type: String,
            enum: ['reserved', 'released', 'completed', 'cancelled', 'expired', 'adjusted', 'restocked'],
            required: true,
            index: true,
        },
        reservationId: { type: String, index: true },
        orderId: { type: String, index: true },
        userId: { type: String, index: true },
        sessionId: { type: String, index: true },
        previousStock: { type: Number },
        newStock: { type: Number },
        previousReserved: { type: Number },
        newReserved: { type: Number },
        reason: { type: String },
        metadata: { type: Schema.Types.Mixed },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound indexes for common queries
InventoryAuditLogSchema.index({ productId: 1, createdAt: -1 });
InventoryAuditLogSchema.index({ eventType: 1, createdAt: -1 });
InventoryAuditLogSchema.index({ reservationId: 1, eventType: 1 });

// TTL: keep audit logs for 90 days
InventoryAuditLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export default mongoose.model<IInventoryAuditLog>('InventoryAuditLog', InventoryAuditLogSchema);
