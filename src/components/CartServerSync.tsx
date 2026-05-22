import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore, getProductId, getCartItemImage } from '@/lib/cart';
import { cartService } from '@/services/cartService';
import type { Product } from '@/lib/products';

function serverLineToProduct(line: {
  productId: string;
  name: string;
  price: number;
  image: string;
  variantImage?: string;
  color?: string;
}): Product {
  return {
    productId: line.productId,
    id: line.productId,
    name: line.name,
    price: line.price,
    image: line.image,
    category: 'Catalog',
    sizes: ['Default'],
    description: '',
    rating: 0,
    reviews: 0,
    stock: 99999,
  };
}

/**
 * When user signs in: prefer server cart if non-empty; otherwise push local cart to API.
 */
export function CartServerSync() {
  const { user, isAuthenticated, loading } = useAuth();
  const ranForUid = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      ranForUid.current = null;
      return;
    }
    if (loading) return;

    if (ranForUid.current === user.uid) return;

    (async () => {
      try {
        const serverCart = await cartService.getCart();
        const localItems = useCartStore.getState().items;

        if (serverCart.items?.length) {
          useCartStore.getState().clearCart();
          for (const it of serverCart.items) {
            useCartStore.getState().addItem(serverLineToProduct(it), it.size, it.quantity, it.variantImage || it.image, it.color);
          }
        } else if (localItems.length) {
          for (const row of localItems) {
            const pid = getProductId(row.product);
            await cartService.addToCart(pid, row.size, row.quantity, getCartItemImage(row), row.color);
          }
          const refreshed = await cartService.getCart();
          if (refreshed.items?.length) {
            useCartStore.getState().clearCart();
            for (const it of refreshed.items) {
              useCartStore.getState().addItem(serverLineToProduct(it), it.size, it.quantity, it.variantImage || it.image, it.color);
            }
          }
        }
        ranForUid.current = user.uid;
      } catch (e) {
        console.warn('Cart server sync skipped:', e);
      }
    })();
  }, [isAuthenticated, loading, user?.uid]);

  return null;
}
