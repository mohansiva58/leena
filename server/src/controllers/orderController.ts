import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Order from '../models/Order';
import Cart from '../models/Cart';
import PaymentClaim from '../models/PaymentClaim';
import { generateOrderId, calculateShipping, validatePhone, validatePincode } from '../utils/helpers';
import { sendOrderConfirmationEmail } from '../config/email';
import { cacheDel } from '../utils/cache';
import {
    resolveOrderLines,
    decrementStockForLines,
    incrementStockForLines,
    RawOrderItemInput,
} from '../services/orderLineItems';
import {
    verifyRazorpaySignature,
    fetchRazorpayPayment,
    fetchRazorpayOrder,
} from '../config/razorpay';

function normalizeShippingAddress(raw: Record<string, unknown>) {
    const pincode = String(raw.pincode || raw.postalCode || '').trim();
    const address = String(raw.address || raw.addressLine1 || '').trim();
    return {
        fullName: String(raw.fullName || '').trim(),
        phone: String(raw.phone || '').trim(),
        email: raw.email ? String(raw.email).trim() : undefined,
        address,
        city: String(raw.city || '').trim(),
        state: String(raw.state || '').trim(),
        pincode,
    };
}

function validateShippingAddress(addr: ReturnType<typeof normalizeShippingAddress>): string | null {
    if (!addr.fullName || !addr.phone || !addr.address || !addr.city || !addr.pincode) {
        return 'Missing required shipping address fields';
    }
    if (!validatePincode(addr.pincode)) {
        return 'Invalid pincode (6 digits required)';
    }
    if (!validatePhone(addr.phone)) {
        return 'Invalid phone number';
    }
    return null;
}

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.uid;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const {
        items,
        shippingAddress: rawShipping,
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    } = req.body;

    try {
        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ error: 'Order items are required' });
            return;
        }

        if (!rawShipping) {
            res.status(400).json({ error: 'Shipping address is required' });
            return;
        }

        if (!paymentMethod || !['razorpay', 'cod'].includes(paymentMethod)) {
            res.status(400).json({ error: 'Valid payment method is required' });
            return;
        }

        const shippingAddress = normalizeShippingAddress(rawShipping as Record<string, unknown>);
        const addrErr = validateShippingAddress(shippingAddress);
        if (addrErr) {
            res.status(400).json({ error: addrErr });
            return;
        }

        // Idempotent replay for same Razorpay payment
        if (paymentMethod === 'razorpay' && razorpayPaymentId) {
            const existing = await Order.findOne({ razorpayPaymentId }).lean();
            if (existing) {
                res.status(200).json({
                    success: true,
                    order: {
                        orderId: existing.orderId,
                        orderStatus: existing.orderStatus,
                        paymentStatus: existing.paymentStatus,
                        total: existing.total,
                        estimatedDelivery: existing.estimatedDelivery,
                    },
                    idempotent: true,
                });
                return;
            }
        }

        const rawItems = items as RawOrderItemInput[];
        let lines;
        let subtotal: number;
        try {
            const resolved = await resolveOrderLines(rawItems);
            lines = resolved.lines;
            subtotal = resolved.subtotal;
        } catch (e) {
            res.status(400).json({ error: (e as Error).message });
            return;
        }

        const shipping = calculateShipping(subtotal);
        const total = subtotal + shipping;
        const totalPaise = Math.round(total * 100);

        let paymentStatus: 'pending' | 'paid' | 'failed' | 'cod' = 'pending';

        if (paymentMethod === 'cod') {
            paymentStatus = 'cod';
        } else if (paymentMethod === 'razorpay') {
            if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
                res.status(400).json({ error: 'Razorpay payment details are required' });
                return;
            }

            if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
                res.status(400).json({ error: 'Invalid payment signature' });
                return;
            }

            let payment: Record<string, unknown>;
            let rpOrder: Record<string, unknown>;
            try {
                payment = await fetchRazorpayPayment(razorpayPaymentId);
                rpOrder = await fetchRazorpayOrder(razorpayOrderId);
            } catch (e) {
                console.error('Razorpay fetch failed:', e);
                res.status(502).json({ error: 'Unable to verify payment with Razorpay' });
                return;
            }

            const orderIdFromPayment = String(payment.order_id || '');
            if (orderIdFromPayment !== razorpayOrderId) {
                res.status(400).json({ error: 'Payment does not match Razorpay order' });
                return;
            }

            const amount = Number(payment.amount);
            if (!Number.isFinite(amount) || amount !== totalPaise) {
                res.status(400).json({
                    error: 'Payment amount mismatch',
                    expectedPaise: totalPaise,
                    receivedPaise: amount,
                });
                return;
            }

            const status = String(payment.status || '');
            if (!['captured', 'authorized'].includes(status)) {
                res.status(400).json({ error: `Payment not successful (status: ${status})` });
                return;
            }

            const notes = (rpOrder.notes || {}) as Record<string, string>;
            const noteUserId = notes.userId || notes.user_id;
            if (noteUserId && String(noteUserId) !== userId) {
                res.status(403).json({ error: 'Payment order does not belong to this user' });
                return;
            }

            paymentStatus = 'paid';
        }

        // Single-flight per Razorpay payment (prevents parallel double stock decrement)
        if (paymentMethod === 'razorpay' && razorpayPaymentId) {
            try {
                await PaymentClaim.create({ razorpayPaymentId, userId });
            } catch (claimErr: unknown) {
                if ((claimErr as { code?: number }).code === 11000) {
                    const ord = await Order.findOne({ razorpayPaymentId }).lean();
                    if (ord) {
                        res.status(200).json({
                            success: true,
                            order: {
                                orderId: ord.orderId,
                                orderStatus: ord.orderStatus,
                                paymentStatus: ord.paymentStatus,
                                total: ord.total,
                                estimatedDelivery: ord.estimatedDelivery,
                            },
                            idempotent: true,
                        });
                        return;
                    }
                    res.status(409).json({ error: 'Payment is being processed — please wait' });
                    return;
                }
                throw claimErr;
            }
        }

        const orderId = generateOrderId();

        try {
            await decrementStockForLines(lines);
        } catch (stockErr) {
            if (paymentMethod === 'razorpay' && razorpayPaymentId) {
                await PaymentClaim.deleteOne({ razorpayPaymentId }).catch(() => undefined);
            }
            res.status(409).json({ error: (stockErr as Error).message });
            return;
        }

        try {
            const order = await Order.create({
                orderId,
                userId,
                userEmail,
                items: lines.map((l) => ({
                    productId: l.productId,
                    name: l.name,
                    price: l.price,
                    image: l.image,
                    size: l.size,
                    quantity: l.quantity,
                    variantImage: l.variantImage,
                })),
                shippingAddress,
                subtotal,
                shipping,
                total,
                paymentMethod,
                paymentStatus,
                razorpayOrderId: paymentMethod === 'razorpay' ? razorpayOrderId : undefined,
                razorpayPaymentId: paymentMethod === 'razorpay' ? razorpayPaymentId : undefined,
                razorpaySignature: paymentMethod === 'razorpay' ? razorpaySignature : undefined,
                orderStatus: 'confirmed',
                estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            });

            try {
                await Cart.findOneAndUpdate({ userId }, { items: [] });
                await cacheDel(`cart:${userId}`);
            } catch (cartError) {
                console.warn('Failed to clear cart:', cartError);
            }

            try {
                await sendOrderConfirmationEmail({
                    customerName: shippingAddress.fullName,
                    customerEmail: shippingAddress.email || userEmail,
                    orderId: order.orderId,
                    orderDate: order.createdAt,
                    items: order.items.map((item) => ({
                        name: item.name,
                        size: item.size,
                        quantity: item.quantity,
                        price: item.price * item.quantity,
                    })),
                    subtotal: order.subtotal,
                    shipping: order.shipping,
                    total: order.total,
                    paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
                    shippingAddress: order.shippingAddress,
                });
            } catch (emailError) {
                console.error('Failed to send order confirmation email:', emailError);
            }

            res.status(201).json({
                success: true,
                order: {
                    orderId: order.orderId,
                    orderStatus: order.orderStatus,
                    paymentStatus: order.paymentStatus,
                    total: order.total,
                    estimatedDelivery: order.estimatedDelivery,
                },
            });
        } catch (createErr: unknown) {
            const code = (createErr as { code?: number }).code;
            await incrementStockForLines(lines).catch((e) => console.error('Stock rollback failed:', e));
            if (paymentMethod === 'razorpay' && razorpayPaymentId) {
                await PaymentClaim.deleteOne({ razorpayPaymentId }).catch(() => undefined);
            }
            if (code === 11000 && razorpayPaymentId) {
                const existing = await Order.findOne({ razorpayPaymentId }).lean();
                if (existing) {
                    res.status(200).json({
                        success: true,
                        order: {
                            orderId: existing.orderId,
                            orderStatus: existing.orderStatus,
                            paymentStatus: existing.paymentStatus,
                            total: existing.total,
                            estimatedDelivery: existing.estimatedDelivery,
                        },
                        idempotent: true,
                    });
                    return;
                }
            }
            console.error('Create order error:', createErr);
            res.status(500).json({ error: 'Failed to create order', details: (createErr as Error).message });
        }
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Failed to create order', details: (error as Error).message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { status, limit = 20, page = 1 } = req.query;

        const query: Record<string, unknown> = { userId };
        if (status && status !== 'all') {
            query.orderStatus = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .limit(Number(limit))
                .skip(skip),
            Order.countDocuments(query),
        ]);

        res.json({
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ orderId, userId });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
            res.status(400).json({
                error: `Cannot cancel order with status: ${order.orderStatus}`,
            });
            return;
        }

        const lines = order.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            image: i.image,
            size: i.size,
            quantity: i.quantity,
            source: (i.productId.startsWith('SALE-') ? 'sale' : 'product') as 'sale' | 'product',
        }));

        await incrementStockForLines(lines);

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = reason;
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
};
