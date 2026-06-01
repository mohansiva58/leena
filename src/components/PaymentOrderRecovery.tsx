import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { orderService } from '@/services/orderService';
import { clearPendingPaidOrder, getPendingPaidOrder } from '@/lib/pendingPaidOrder';
import { useCartStore } from '@/lib/cart';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PaymentOrderRecovery() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const running = useRef(false);

  useEffect(() => {
    if (loading || !isAuthenticated || running.current) return;

    const pendingOrder = getPendingPaidOrder();
    if (!pendingOrder?.razorpayPaymentId) return;

    running.current = true;

    (async () => {
      let createdOrderId: string | null = null;

      for (const delay of [0, 1500, 3000, 6000, 10000]) {
        if (delay) await wait(delay);
        try {
          const result = await orderService.createOrder(pendingOrder);
          createdOrderId = result.order.orderId;
          break;
        } catch (error) {
          console.error('Pending paid order recovery attempt failed:', error);
        }
      }

      if (!createdOrderId) {
        try {
          const recentOrders = await orderService.getOrders({ limit: 1 });
          const latestOrder = Array.isArray(recentOrders?.orders)
            ? recentOrders.orders[0]
            : Array.isArray(recentOrders)
              ? recentOrders[0]
              : null;
          createdOrderId = latestOrder?.orderId || null;
        } catch (error) {
          console.error('Pending paid order reconciliation failed:', error);
        }
      }

      if (createdOrderId) {
        clearPendingPaidOrder();
        useCartStore.getState().clearCart();
        toast.success(`Order ${createdOrderId} placed successfully.`);
        navigate('/orders', { replace: true });
      }

      running.current = false;
    })();
  }, [isAuthenticated, loading, navigate]);

  return null;
}
