import { CreateOrderData } from '@/services/orderService';

const PENDING_PAID_ORDER_KEY = 'leena_pending_paid_order_v1';

export type PendingPaidOrder = CreateOrderData & {
  savedAt: number;
};

export const savePendingPaidOrder = (order: CreateOrderData) => {
  localStorage.setItem(
    PENDING_PAID_ORDER_KEY,
    JSON.stringify({ ...order, savedAt: Date.now() })
  );
};

export const getPendingPaidOrder = (): PendingPaidOrder | null => {
  try {
    const raw = localStorage.getItem(PENDING_PAID_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingPaidOrder;
  } catch {
    localStorage.removeItem(PENDING_PAID_ORDER_KEY);
    return null;
  }
};

export const clearPendingPaidOrder = () => {
  localStorage.removeItem(PENDING_PAID_ORDER_KEY);
};
