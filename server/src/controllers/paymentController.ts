import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getRazorpayInstance, verifyRazorpaySignature } from '../config/razorpay';
import { generateOrderId } from '../utils/helpers';

type RazorpayApiError = {
    statusCode?: number;
    status?: number;
    code?: string;
    message?: string;
    error?: {
        code?: string;
        description?: string;
    };
    response?: {
        status?: number;
        data?: {
            error?: {
                code?: string;
                description?: string;
            };
        };
    };
};

const getRazorpayErrorDetails = (error: unknown) => {
    const err = error as RazorpayApiError;
    const statusCode = err.statusCode || err.status || err.response?.status;
    const apiError = err.error || err.response?.data?.error;

    return {
        statusCode,
        code: apiError?.code || err.code,
        description: apiError?.description || err.message,
    };
};

export const createRazorpayOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { amount, currency = 'INR' } = req.body;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            res.status(400).json({ error: 'Valid amount is required' });
            return;
        }

        const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!keyId) {
            res.status(503).json({ error: 'Payment gateway is not configured' });
            return;
        }

        const razorpay = getRazorpayInstance();

        const options = {
            amount: Math.round(numericAmount * 100), // Convert to paise
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
            keyId,
        });
    } catch (error) {
        const details = getRazorpayErrorDetails(error);
        console.error('Create Razorpay order error:', details);

        if (details.statusCode === 401) {
            res.status(502).json({ error: 'Payment gateway authentication failed. Check Razorpay key ID and secret.' });
            return;
        }

        if (details.statusCode) {
            res.status(502).json({ error: details.description || 'Payment gateway rejected the order request' });
            return;
        }

        res.status(503).json({ error: 'Unable to reach payment gateway. Please try again.' });
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
