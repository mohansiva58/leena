---
name: Leena cart store
description: Zustand cart store decisions — localStorage key, what's persisted, updateItemStock, and reservation IDs.
---

## localStorage key: `sw_cart_v2`
Bumped from `sw_cart_v1` when `partialize` was expanded to also persist `sessionId` and `reservationIds`.

**Why:** If the user refreshes during checkout, the checkout page needs the same `sessionId` and `reservationIds` to manage/extend the reservations it already created. Without persisting these, the reservation state is lost on refresh and the checkout creates duplicate reservations.

**How to apply:** If you change the shape of persisted data again, bump the key to `sw_cart_v3`.

## What's persisted
```typescript
partialize: (state) => ({ items: state.items, sessionId: state.sessionId, reservationIds: state.reservationIds })
```
`sessionId` is generated once (`sess_XXXX`) and lives forever in localStorage unless `clearCart()` is called.

## `updateItemStock(productId, size, total, reserved)`
Added to keep the **embedded product data** inside cart items in sync with real-time socket updates.

**Why:** Cart items store a snapshot of the product at add-time. When stock changes via socket, the cart's `addItem`/`updateQuantity` stock checks would use stale data. `updateItemStock` patches `sizeCounts[size]` and `sizeReservedCounts[size]` in every cart item for that product.

Called by `useRealTimeStock` on every `stockUpdate` event.

## Key files
- `artifacts/leena/src/lib/cart.ts`
