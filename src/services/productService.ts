import api from './api';
import { Product } from '@/lib/products';

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sort?: 'price-asc' | 'price-desc' | 'rating' | 'popular';
}

export interface PagedProductFilters extends ProductFilters {
    size?: string | null;
    filter?: 'new' | 'bestseller' | null;
    page: number;
    limit: number;
}

export interface PagedProductResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface StockCheckItem {
    productId: string;
    size: string;
    quantity: number;
}

export interface StockCheckResponse {
    available: boolean;
    items: Array<{
        productId: string;
        size: string;
        quantity: number;
        maxAvailable: number;
        available: boolean;
        name?: string;
        image?: string;
    }>;
}

export const productService = {
    getAllProducts: async (filters?: ProductFilters): Promise<Product[]> => {
        const params = new URLSearchParams();
        if (filters?.category) params.append('category', filters.category);
        if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters?.search) params.append('search', filters.search);
        if (filters?.sort) params.append('sort', filters.sort);

        const response = await api.get(`/products?${params.toString()}`);
        console.log('Fetched products:', response.data);
        // Log image URLs for debugging
        response.data.forEach((p: Product) => {
            if (!p.image) {
                console.warn('Product missing image:', p.name);
            }
        });
        return response.data;
    },

    getPagedProducts: async (filters: PagedProductFilters): Promise<PagedProductResponse> => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.size) params.append('size', filters.size);
        if (filters.filter) params.append('filter', filters.filter);
        params.append('page', filters.page.toString());
        params.append('limit', filters.limit.toString());

        const response = await api.get(`/products?${params.toString()}`);
        console.log('Fetched paged products:', response.data);
        if (Array.isArray(response.data)) {
            const items = response.data;
            return {
                items,
                total: items.length,
                page: filters.page,
                limit: filters.limit,
                hasMore: items.length >= filters.limit,
            };
        }

        return {
            items: Array.isArray(response.data?.items) ? response.data.items : [],
            total: Number(response.data?.total || 0),
            page: Number(response.data?.page || filters.page),
            limit: Number(response.data?.limit || filters.limit),
            hasMore: Boolean(response.data?.hasMore),
        };
    },

    getProductById: async (id: string): Promise<Product> => {
        const response = await api.get(`/products/${id}`);
        console.log('Fetched product:', response.data);
        return response.data;
    },

    getFeaturedProducts: async (): Promise<Product[]> => {
        const response = await api.get('/products/featured');
        return response.data;
    },

    checkStockAvailability: async (items: StockCheckItem[]): Promise<StockCheckResponse> => {
        const response = await api.post('/products/check-stock', { items });
        return response.data;
    },
};
