import { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import { orderService, CreateOrderData } from '@/services/orderService';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    method: {
        card: boolean;
        netbanking: boolean;
        wallet: boolean;
        upi: boolean;
    };
    config: {
        display: {
            blocks: Record<string, {
                name: string;
                instruments: Array<{
                    method: string;
                    flow?: string;
                }>;
            }>;
            sequence: string[];
            preferences: {
                show_default_blocks: boolean;
            };
        };
    };
    handler: (response: RazorpayResponse) => Promise<void>;
    modal: {
        ondismiss: () => void;
    };
}

interface RazorpayResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayCheckoutProps {
    amount: number;
    orderData: CreateOrderData;
    onSuccess: (orderId: string) => void;
    onFailure: (error: unknown) => void;
}

export const useRazorpayCheckout = () => {
    const { user } = useAuth();
    const inFlight = useRef(false);

    const initiatePayment = async ({ amount, orderData, onSuccess, onFailure }: RazorpayCheckoutProps) => {
        try {
            if (!user) {
                throw new Error('Please login to continue');
            }
            if (inFlight.current) {
                toast.message('పేమెంట్ ఇప్పటికే ప్రారంభమైంది');
                return;
            }
            inFlight.current = true;

            // Create Razorpay order
            const razorpayOrder = await paymentService.createRazorpayOrder(amount);

            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Leena Collection',
                description: 'Purchase Order',
                order_id: razorpayOrder.orderId,
                prefill: {
                    name: orderData.shippingAddress.fullName,
                    email: orderData.shippingAddress.email || user.email || '',
                    contact: orderData.shippingAddress.phone,
                },
                theme: {
                    color: '#66021F',
                },
                method: {
                    card: true,
                    netbanking: true,
                    wallet: true,
                    upi: true,
                },
                config: {
                    display: {
                        blocks: {
                            cards: {
                                name: 'Cards',
                                instruments: [{ method: 'card' }],
                            },
                            upi: {
                                name: 'UPI',
                                instruments: [
                                    { method: 'upi', flow: 'collect' },
                                    { method: 'upi', flow: 'intent' },
                                ],
                            },
                            banks: {
                                name: 'Netbanking',
                                instruments: [{ method: 'netbanking' }],
                            },
                            wallets: {
                                name: 'Wallets',
                                instruments: [{ method: 'wallet' }],
                            },
                        },
                        sequence: ['block.cards', 'block.upi', 'block.banks', 'block.wallets'],
                        preferences: {
                            show_default_blocks: true,
                        },
                    },
                },
                handler: async function (response: RazorpayResponse) {
                    try {
                        // Verify payment
                        await paymentService.verifyPayment({
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        // Create order in database
                        const orderRes = await orderService.createOrder({
                            ...orderData,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                        });

                        toast.success('Payment successful! Order placed.');
                        onSuccess(orderRes.order.orderId);
                    } catch (error) {
                        console.error('Payment verification failed:', error);
                        toast.error('Payment verification failed');
                        onFailure(error);
                    } finally {
                        inFlight.current = false;
                    }
                },
                modal: {
                    ondismiss: function () {
                        inFlight.current = false;
                        toast.info('Payment cancelled');
                        onFailure(new Error('Payment cancelled by user'));
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            inFlight.current = false;
            console.error('Razorpay error:', error);
            toast.error('Failed to initiate payment');
            onFailure(error);
        }
    };

    return { initiatePayment };
};
