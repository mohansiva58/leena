import api from './api';

export interface RazorpayOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

export interface PaymentVerificationData {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
}

export const paymentService = {
    createRazorpayOrder: async (amount: number): Promise<RazorpayOrderResponse> => {
        const response = await api.post('/payment/create-order', { amount });
        return response.data;
    },

    verifyPayment: async (data: PaymentVerificationData): Promise<{ success: boolean }> => {
        const response = await api.post('/payment/verify', data);
        return response.data;
    },
};
