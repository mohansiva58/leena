---
name: Leena real-time stock
description: How Socket.io stock updates flow from backend to frontend — which pages need the hook, what it updates, and when toasts fire.
---

## The rule
`useRealTimeStock()` MUST be called in every page that displays stock or allows cart actions. Missing it means that page won't see live changes.

**Currently called in:** ShopPage, ProductDetailPage, CartPage, CheckoutPage.

**Why:** The hook is a singleton listener on the shared socket. Each page that shows stock needs to be subscribed so its React Query cache updates when another user reserves/releases.

## What the hook does on each `stockUpdate` event
1. Updates React Query cache — `['product', productId]` + all `['products']` queries — so product components re-render with fresh stock
2. Calls `cartStore.updateItemStock(productId, size, total, reserved)` — updates the embedded product data inside cart items so add-to-cart / updateQuantity stock checks stay accurate
3. If a cart item is affected: shows `toast.error` if now out of stock, `toast.warning` if stock < quantity in cart

## Socket event shape
```typescript
{ productId: string; size: string; available: number; total: number; reserved: number }
```
Backend broadcasts per-size (one event per affected size), not a full product snapshot.

## Real-time visual effects
- **ProductCard**: uses `useRef` + `useState` to detect when `available` drops; triggers `stockFlash='down'` state for 900ms; `AnimatePresence` re-animates the stock badge with a scale bounce
- **CartPage `LiveStockBadge`**: similar ref-based detection; sets `flash` state for 900ms; badge color changes to red for OOS, amber for low
- **ProductDetailPage size buttons**: already had `animate` props tied to `remaining === 0`

## Key files
- `artifacts/leena/src/hooks/useRealTimeStock.ts` — the hook
- `artifacts/leena/src/hooks/useSocket.ts` — singleton socket instance
- `artifacts/leena/src/components/ProductCard.tsx` — flash animation logic
- `artifacts/leena/src/pages/CartPage.tsx` — `LiveStockBadge` component
