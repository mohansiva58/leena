import api from './api';
export interface Cart {
    _id: string;
    userId: string;
    items: ServerCartItem[];
    updatedAt: string;
}

export interface ServerCartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    variantImage?: string;
    color?: string;
}

type SizeQuantityPayload =
    | Array<{ size: string; quantity: number }>
    | Record<string, number>
    | string;

export const cartService = {
    getCart: async (): Promise<Cart> => {
        const response = await api.get('/cart');
        return response.data;
    },

    getAvailability: async (): Promise<{
        available: boolean;
        items: Array<{
            productId: string;
            size: string;
            color?: string;
            quantity: number;
            available: boolean;
            maxAvailable: number;
            message?: string;
        }>;
    }> => {
        const response = await api.get('/cart/availability');
        return response.data;
    },

    addToCart: async (
        productId: string,
        size: string,
        quantity: number = 1,
        variantImage?: string,
        color?: string,
        sizeQuantities?: SizeQuantityPayload,
        sizeCounts?: SizeQuantityPayload
    ): Promise<Cart> => {
        const response = await api.post('/cart/add', { productId, size, quantity, variantImage, color, sizeQuantities, sizeCounts });
        return response.data;
    },

    updateCartItem: async (
        productId: string,
        size: string,
        quantity: number,
        color?: string,
        variantImage?: string,
        sizeQuantities?: SizeQuantityPayload,
        sizeCounts?: SizeQuantityPayload
    ): Promise<Cart> => {
        const response = await api.put('/cart/update', { productId, size, quantity, color, variantImage, sizeQuantities, sizeCounts });
        return response.data;
    },

    removeFromCart: async (productId: string, size: string, color?: string, variantImage?: string): Promise<Cart> => {
        const params = new URLSearchParams();
        if (color) params.set('color', color);
        if (variantImage) params.set('variantImage', variantImage);
        const query = params.toString();
        const url = `/cart/remove/${productId}/${size}${query ? `?${query}` : ''}`;
        const response = await api.delete(url);
        return response.data;
    },

    clearCart: async (): Promise<void> => {
        await api.delete('/cart/clear');
    },
};
