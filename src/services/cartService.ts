import api from './api';
import { CartItem } from '@/lib/cart';

export interface Cart {
    _id: string;
    userId: string;
    items: CartItem[];
    updatedAt: string;
}

export const cartService = {
    getCart: async (): Promise<Cart> => {
        const response = await api.get('/cart');
        return response.data;
    },

    addToCart: async (productId: string, size: string, quantity: number = 1, variantImage?: string, color?: string): Promise<Cart> => {
        const response = await api.post('/cart/add', { productId, size, quantity, variantImage, color });
        return response.data;
    },

    updateCartItem: async (productId: string, size: string, quantity: number, color?: string): Promise<Cart> => {
        const response = await api.put('/cart/update', { productId, size, quantity, color });
        return response.data;
    },

    removeFromCart: async (productId: string, size: string, color?: string): Promise<Cart> => {
        const url = `/cart/remove/${productId}/${size}` + (color ? `?color=${encodeURIComponent(color)}` : '');
        const response = await api.delete(url);
        return response.data;
    },

    clearCart: async (): Promise<void> => {
        await api.delete('/cart/clear');
    },
};
