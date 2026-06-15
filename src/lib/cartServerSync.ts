import { cartService, Cart, ServerCartItem } from '@/services/cartService';
import { useCartStore, getProductId, getCartItemImage, type CartItem } from '@/lib/cart';
import type { Product } from '@/lib/products';
import axios from 'axios';

const CART_SYNC_SIGNAL_KEY = 'sw_cart_sync_signal';

function serverLineKey(productId: string, size: string, color?: string, image?: string) {
  return `${productId}:${size}:${color || ''}:${image || 'default'}`;
}

function collectProductIds(product: Product): string[] {
  const ids = new Set<string>();
  if (product.productId) ids.add(product.productId);
  if (product.id) ids.add(product.id);
  if (product._id) ids.add(String(product._id));
  return [...ids];
}

function serverLineMatchesLocal(serverItem: ServerCartItem, localRow: CartItem): boolean {
  const localIds = collectProductIds(localRow.product);
  if (!localIds.includes(serverItem.productId)) return false;
  if (serverItem.size !== localRow.size) return false;
  return (serverItem.color || '') === (localRow.color || '');
}

function getServerQuantityForLocal(serverItems: ServerCartItem[], localRow: CartItem): number {
  return serverItems
    .filter((item) => serverLineMatchesLocal(item, localRow))
    .reduce((sum, item) => sum + item.quantity, 0);
}

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

function buildServerQuantityMap(items: ServerCartItem[] = []) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const key = serverLineKey(item.productId, item.size, item.color, item.variantImage || item.image);
    quantities.set(key, (quantities.get(key) || 0) + item.quantity);
  }
  return quantities;
}

export async function mergeLocalCartToServer() {
  const localItems = useCartStore.getState().items;
  const serverCart = await cartService.getCart();
  const serverQuantities = buildServerQuantityMap(serverCart.items);

  if (!localItems.length) {
    if (serverCart.items?.length) {
      applyServerCartToLocal(serverCart);
    }
    return serverCart;
  }

  for (const row of localItems) {
    const pid = getProductId(row.product);
    const image = getCartItemImage(row);
    const serverQty = getServerQuantityForLocal(serverCart.items, row);
    const delta = row.quantity - serverQty;

    if (delta <= 0) continue;

    try {
      await cartService.addToCart(pid, row.size, delta, image, row.color);
      const key = serverLineKey(pid, row.size, row.color, image);
      serverQuantities.set(key, serverQty + delta);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          useCartStore.getState().removeItem(pid, row.size, image, row.color);
          continue;
        }
        if (error.response?.status === 400) {
          continue;
        }
      }
      throw error;
    }
  }

  const refreshed = await cartService.getCart();
  applyServerCartToLocal(refreshed);
  return refreshed;
}

/** @deprecated Use mergeLocalCartToServer */
export async function ensureLocalCartSyncedToServer() {
  return mergeLocalCartToServer();
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
