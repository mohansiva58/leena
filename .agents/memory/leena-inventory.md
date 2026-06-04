---
name: Leena inventory system
description: How stock reservations work — MongoDB atomic ops, order creation confirms reservations, cleanup job, idempotency.
---

## The rule
`available = sizeCounts[size] - sizeReservedCounts[size]` — always use BOTH fields for real availability. Never use raw `sizeCounts` alone.

**Why:** `sizeCounts` is total physical stock; `sizeReservedCounts` is currently held by active reservations. Raw `sizeCounts` will show stock that's already reserved by other sessions in checkout.

**How to apply:** Any stock check (add-to-cart guard, size button disabled state, checkout validation) must compute `Math.max(0, total - reserved)`.

## MongoDB atomic ops (no transactions)
Uses `$inc` on a single document for reservation — no replica set needed, no transactions.

```typescript
// Reserve: $inc { sizeReservedCounts.M: +quantity }
// Release: $inc { sizeReservedCounts.M: -quantity }  (atomic, no oversell)
// Rollback: if StockReservation.create() fails, $inc sizeReservedCounts back by -quantity
```

## Reservation flow
1. `POST /api/inventory/reserve` → `StockReservationService.reserveCartItems()` → atomic $inc, creates StockReservation doc
2. Checkout page stores `reservationIds` in cart store (persisted to localStorage)
3. `beforeunload` releases all reservations for the session
4. Payment success → `orderService.createOrder()` sends `reservationIds` in body
5. `orderController` calls `StockReservationService.completeReservation()` for each ID — converts reserved → actual deducted stock
6. If any reservation expired, `orderController` falls back to `decrementStockForLines()` directly

## Cleanup job
`index.ts` runs `StockReservationService.cleanupExpiredReservations()` every 60 s (also once on startup). Expired reservations are released and stock is restored.

## Idempotency
- `releaseStock`: checks `reservation.status !== 'reserved'` → returns `true` if already released/completed (safe to call twice)
- `reserveStock`: if same session/product/size already has a valid reservation, refreshes TTL instead of double-reserving; if quantity changed, releases old + reserves new
- `orderController`: checks `razorpayPaymentId` uniqueness — returns existing order if already processed (duplicate webhook protection)

## Key files
- `artifacts/api-server/src/services/StockReservationService.ts`
- `artifacts/api-server/src/controllers/orderController.ts` (lines 210-231: reservation confirmation logic)
- `artifacts/api-server/src/controllers/inventoryController.ts`
- `artifacts/api-server/src/routes/inventory.ts`
- `artifacts/api-server/src/index.ts` (cleanup job)
