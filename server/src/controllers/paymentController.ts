import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getRazorpayInstance, verifyRazorpaySignature } from '../config/razorpay';
import { generateOrderId } from '../utils/helpers';

export const createRazorpayOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { amount, currency = 'INR' } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ error: 'Valid amount is required' });
            return;
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency,
            receipt: generateOrderId(),
            notes: {
                userId: String(userId),
            },
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            res.status(400).json({ error: 'Missing payment verification parameters' });
            return;
        }

        const isValid = verifyRazorpaySignature(
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature
        );

        if (!isValid) {
            res.status(400).json({ error: 'Invalid payment signature' });
            return;
        }

        res.json({
            success: true,
            message: 'Payment verified successfully',
            razorpayOrderId,
            razorpayPaymentId
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
};
