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
        sizeQuantities?: SizeQuantityPayload,
        sizeCounts?: SizeQuantityPayload
    ): Promise<Cart> => {
        const response = await api.put('/cart/update', { productId, size, quantity, color, sizeQuantities, sizeCounts });
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
