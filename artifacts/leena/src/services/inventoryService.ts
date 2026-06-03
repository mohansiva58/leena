import api from './api';

export interface ReservationItem {
    productId: string;
    size: string;
    quantity: number;
    color?: string;
}

export interface ReservationResult {
    reservationId: string;
    productId: string;
    size: string;
    quantity: number;
    expiresAt: string;
}

export interface ReserveResponse {
    success: boolean;
    reservations: ReservationResult[];
    expiresAt: string;
}

export const inventoryService = {
    reserveStock: async (items: ReservationItem[], sessionId: string): Promise<ReserveResponse> => {
        const response = await api.post('/inventory/reserve', { items, sessionId });
        return response.data;
    },

    releaseStock: async (reservationId: string): Promise<{ success: boolean }> => {
        const response = await api.post('/inventory/release', { reservationId });
        return response.data;
    },

    confirmReservation: async (reservationId: string): Promise<{ success: boolean }> => {
        const response = await api.post('/inventory/confirm', { reservationId });
        return response.data;
    },

    refreshReservation: async (reservationId: string): Promise<{ success: boolean }> => {
        const response = await api.post('/inventory/refresh', { reservationId });
        return response.data;
    },

    refreshAllReservations: async (sessionId: string): Promise<{ success: boolean; refreshed: number }> => {
        const response = await api.post('/inventory/refresh-all', { sessionId });
        return response.data;
    },

    releaseAllForSession: async (sessionId: string): Promise<{ success: boolean; released: number }> => {
        const response = await api.post('/inventory/release-all', { sessionId });
        return response.data;
    },

    getProductStock: async (productId: string): Promise<{
        productId: string;
        sizes: Record<string, { total: number; reserved: number; available: number }>;
        totalStock: number;
        totalReserved: number;
        totalAvailable: number;
    }> => {
        const response = await api.get(`/inventory/products/${productId}/stock`);
        return response.data;
    },
};
