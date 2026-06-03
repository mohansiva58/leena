import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

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

        socket.on('stockUpdate', (data: StockUpdate) => {
            console.log('Real-time stock update received:', data);

            const updater = (oldData: any) => {
                if (!oldData) return oldData;

                const sizeCounts = { ...(oldData.sizeCounts || {}) };
                const sizeReservedCounts = { ...(oldData.sizeReservedCounts || {}) };

                // Update total and reserved counts for this size
                sizeCounts[data.size] = data.total;
                sizeReservedCounts[data.size] = data.reserved;

                // Recalculate total available stock
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

            // 1. Force immediate cache update for the specific product detail query
            queryClient.setQueryData(['product', data.productId], updater);

            // 2. Force immediate cache update for any active product lists
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
        });

        return () => {
            socket.off('stockUpdate');
        };
    }, [socket, queryClient]);
};
