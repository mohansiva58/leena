import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useQueryClient } from '@tanstack/react-query';

interface StockUpdate {
    productId: string;
    size: string;
    stock: number;
}

export const useRealTimeStock = (productId?: string) => {
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!socket) return;

        socket.on('stockUpdate', (data: StockUpdate) => {
            console.log('Real-time stock update received:', data);
            
            // 1. Force immediate cache update for the specific product detail query
            queryClient.setQueryData(['product', data.productId], (oldData: unknown) => {
                if (!oldData) return oldData;
                
                const newData = { ...(oldData as Record<string, unknown>) };
                
                // Ensure sizeCounts exists and is an object
                const currentSizeCounts = { ...((newData.sizeCounts as Record<string, number>) || {}) };
                currentSizeCounts[data.size] = data.stock;
                
                newData.sizeCounts = currentSizeCounts;
                
                // Recalculate total available stock
                const total = Object.values(currentSizeCounts).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
                newData.stock = total;
                
                return newData;
            });

            // 2. Force immediate cache update for any active product lists (Shop Page, Featured, etc.)
            queryClient.setQueriesData({ queryKey: ['products'] }, (oldData: any) => {
                if (!oldData) return oldData;
                
                // If the cached structure is a direct array of products
                if (Array.isArray(oldData)) {
                    return oldData.map((p: any) => {
                        const pid = p.productId || p._id || p.id;
                        if (pid === data.productId) {
                            const sizeCounts = { ...(p.sizeCounts || {}) };
                            sizeCounts[data.size] = data.stock;
                            const total = Object.values(sizeCounts).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
                            return { ...p, sizeCounts, stock: total };
                        }
                        return p;
                    });
                }
                
                // If the cached structure is a paged response: { items: [...], total, ... }
                if (oldData && typeof oldData === 'object' && 'items' in oldData && Array.isArray(oldData.items)) {
                    return {
                        ...oldData,
                        items: oldData.items.map((p: any) => {
                            const pid = p.productId || p._id || p.id;
                            if (pid === data.productId) {
                                const sizeCounts = { ...(p.sizeCounts || {}) };
                                sizeCounts[data.size] = data.stock;
                                const total = Object.values(sizeCounts).reduce((acc: number, val: number) => acc + (Number(val) || 0), 0);
                                return { ...p, sizeCounts, stock: total };
                            }
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
