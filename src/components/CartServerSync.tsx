import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore, getProductId, getCartItemImage } from '@/lib/cart';
import { cartService } from '@/services/cartService';
import { applyServerCartToLocal, getCartSyncSignalKey, refreshLocalCartFromServer } from '@/lib/cartServerSync';
import axios from 'axios';

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
          applyServerCartToLocal(serverCart);
        } else if (localItems.length) {
          for (const row of localItems) {
            const pid = getProductId(row.product);
            try {
              await cartService.addToCart(pid, row.size, row.quantity, getCartItemImage(row), row.color);
            } catch (error) {
              if (axios.isAxiosError(error) && error.response?.status === 404) {
                useCartStore.getState().removeItem(pid, row.size, getCartItemImage(row), row.color);
                continue;
              }
              throw error;
            }
          }
          const refreshed = await cartService.getCart();
          if (refreshed.items?.length) {
            applyServerCartToLocal(refreshed);
          }
        }
        ranForUid.current = user.uid;
      } catch (e) {
        console.warn('Cart server sync skipped:', e);
      }
    })();
  }, [isAuthenticated, loading, user?.uid]);

  useEffect(() => {
    if (!isAuthenticated || !user?.uid || loading) return;

    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await refreshLocalCartFromServer();
      } catch (error) {
        console.warn('Cart refresh skipped:', error);
      } finally {
        refreshing = false;
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getCartSyncSignalKey()) {
        refresh();
      }
    };

    const handleFocus = () => {
      refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, loading, user?.uid]);

  return null;
}
