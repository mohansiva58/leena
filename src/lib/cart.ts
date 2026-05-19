import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from './products';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color?: string; // Selected color name
  variantImage?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, size: string, quantity?: number, variantImage?: string, color?: string) => boolean;
  removeItem: (productId: string, size: string, variantImage?: string, color?: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number, variantImage?: string, color?: string) => boolean;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const getProductId = (product: Product): string => {
  return product.productId || product.id || product._id || '';
};

export const getCartItemImage = (item: CartItem): string => {
  return item.variantImage || item.product.image;
};

export const getCartLineKey = (productId: string, size: string, variantImage?: string, color?: string): string => {
  return `${productId}-${size}-${color || 'default'}-${variantImage || 'default'}`;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, quantity = 1, variantImage, color) => {
        if (product.stock !== undefined && product.stock <= 0) {
          return false;
        }

        set((state) => {
          const productId = getProductId(product);
          const existingItem = state.items.find(
            (item) =>
              getProductId(item.product) === productId &&
              item.size === size &&
              item.color === color &&
              getCartItemImage(item) === (variantImage || product.image)
          );

          const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

          if (product.stock !== undefined && totalQuantity > product.stock) {
            return state;
          }

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                getProductId(item.product) === productId &&
                item.size === size &&
                item.color === color &&
                getCartItemImage(item) === (variantImage || product.image)
                  ? { ...item, quantity: totalQuantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, { product, size, quantity, color, variantImage }],
          };
        });
        return true;
      },

      removeItem: (productId, size, variantImage, color) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                getProductId(item.product) === productId &&
                item.size === size &&
                item.color === color &&
                (!variantImage || getCartItemImage(item) === variantImage)
              )
          ),
        }));
      },

      updateQuantity: (productId, size, quantity, variantImage, color) => {
        const state = get();
        const item = state.items.find(
          (item) =>
            getProductId(item.product) === productId &&
            item.size === size &&
            item.color === color &&
            (!variantImage || getCartItemImage(item) === variantImage)
        );

        if (!item) return false;

        if (item.product.stock !== undefined && quantity > item.product.stock) {
          return false;
        }

        set((state) => ({
          items: state.items.map((item) =>
            getProductId(item.product) === productId &&
            item.size === size &&
            item.color === color &&
            (!variantImage || getCartItemImage(item) === variantImage)
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
        return true;
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'sw_cart_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
