import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore, getProductId } from '@/lib/cart';
import { toast } from 'sonner';

interface StockUpdate {
    productId: string;
    size: string;
    available: number;
    total: number;
    reserved: number;
}

export const useRealTimeStock = (productId?: string) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        const handleStockUpdate = (data: StockUpdate) => {
            console.log('[RT] stockUpdate:', data);

            // ── 1. Update React Query cache ──────────────────────────────────
            const updater = (oldData: any) => {
                if (!oldData) return oldData;

                const sizeCounts = { ...(oldData.sizeCounts || {}) };
                const sizeReservedCounts = { ...(oldData.sizeReservedCounts || {}) };

                sizeCounts[data.size] = data.total;
                sizeReservedCounts[data.size] = data.reserved;

                const totalAvailable = Object.keys(sizeCounts).reduce((acc: number, key: string) => {
                    const total = Number(sizeCounts[key] || 0);
                    const reserved = Number(sizeReservedCounts[key] || 0);
                    return acc + Math.max(0, total - reserved);
                }, 0);

                return {
                    ...oldData,
                    sizeCounts,
                    sizeReservedCounts,
                    stock: totalAvailable,
                };
            };

            // Update specific product detail query
            queryClient.setQueryData(['product', data.productId], updater);

            // Update all product list queries
            queryClient.setQueriesData({ queryKey: ['products'] }, (oldData: any) => {
                if (!oldData) return oldData;

                if (Array.isArray(oldData)) {
                    return oldData.map((p: any) => {
                        const pid = p.productId || p._id || p.id;
                        if (pid === data.productId) return updater(p);
                        return p;
                    });
                }

                if (oldData && typeof oldData === 'object' && 'items' in oldData && Array.isArray(oldData.items)) {
                    return {
                        ...oldData,
                        items: oldData.items.map((p: any) => {
                            const pid = p.productId || p._id || p.id;
                            if (pid === data.productId) return updater(p);
                            return p;
                        })
                    };
                }

                return oldData;
            });

            // ── 2. Update embedded product data inside cart items ────────────
            // This keeps addItem / updateQuantity stock checks accurate after
            // real-time changes — without this, the cart uses stale sizeCounts.
            const cartStore = useCartStore.getState();
            cartStore.updateItemStock(data.productId, data.size, data.total, data.reserved);

            // ── 3. Alert if a cart item is affected by the stock change ──────
            const affectedItems = cartStore.items.filter((item) => {
                const pid = getProductId(item.product);
                return pid === data.productId && item.size === data.size;
            });

            if (affectedItems.length > 0) {
                const cartItem = affectedItems[0];
                const toastId = `stock-alert-${data.productId}-${data.size}`;

                if (data.available === 0) {
                    toast.error(
                        `"${cartItem.product.name}" (${data.size}) just went out of stock!`,
                        { id: toastId, duration: 5000 }
                    );
                } else if (data.available < cartItem.quantity) {
                    toast.warning(
                        `Only ${data.available} left of "${cartItem.product.name}" (${data.size}) — your cart has ${cartItem.quantity}`,
                        { id: toastId, duration: 5000 }
                    );
                }
            }
        };

        socket.on('stockUpdate', handleStockUpdate);

        return () => {
            socket.off('stockUpdate', handleStockUpdate);
        };
    }, [socket, queryClient]);
};
