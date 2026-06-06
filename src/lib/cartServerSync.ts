import { cartService, Cart, ServerCartItem } from '@/services/cartService';
import { useCartStore } from '@/lib/cart';
import type { Product } from '@/lib/products';

const CART_SYNC_SIGNAL_KEY = 'sw_cart_sync_signal';

function serverLineToProduct(line: ServerCartItem): Product {
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

export function applyServerCartToLocal(cart: Cart | null | undefined) {
  const store = useCartStore.getState();
  store.clearCart();

  for (const item of cart?.items || []) {
    store.addItem(
      serverLineToProduct(item),
      item.size,
      item.quantity,
      item.variantImage || item.image,
      item.color
    );
  }
}

export async function refreshLocalCartFromServer() {
  const cart = await cartService.getCart();
  applyServerCartToLocal(cart);
  return cart;
}

export function notifyCartChangedAcrossTabs() {
  try {
    localStorage.setItem(CART_SYNC_SIGNAL_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures; the active tab still updates immediately.
  }
}

export function getCartSyncSignalKey() {
  return CART_SYNC_SIGNAL_KEY;
}
