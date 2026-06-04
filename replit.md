# Leena — Premium Women's Fashion E-Commerce

A full-stack Indian women's fashion store with real-time inventory management, stock reservations, Razorpay payments, and Socket.io live updates.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/leena run dev` — run the Vite frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `node artifacts/api-server/scripts/seed-quick.mjs` — re-seed MongoDB with 4 products
- Required env: Firebase secrets (`VITE_FIREBASE_*`), MongoDB connection — see `.env` or Replit secrets

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind + shadcn + React Router + Zustand + TanStack Query + Framer Motion
- Backend: Express 5 + MongoDB (Mongoose) + Socket.io + Firebase Auth + Razorpay
- Real-time: Socket.io broadcasts `stockUpdate` per size-change; frontend updates React Query cache + cart items + shows toasts
- API: `artifacts/api-server/` (port 8080)
- Spec: `lib/api-spec/openapi.yaml` (all inventory endpoints documented)

## Where things live

- **Products / stock model**: `artifacts/api-server/src/models/Product.ts` — `sizeCounts` (total) + `sizeReservedCounts` (reserved)
- **Reservation logic**: `artifacts/api-server/src/services/StockReservationService.ts`
- **Audit log**: `artifacts/api-server/src/models/InventoryAuditLog.ts` + `src/services/InventoryAuditService.ts`
- **Inventory routes**: `artifacts/api-server/src/routes/inventory.ts` → `GET /api/inventory/products/:id/stock`, `POST /api/inventory/reserve|release|confirm|refresh|refresh-all|release-all`
- **Cart store**: `artifacts/leena/src/lib/cart.ts` — persists `items`, `sessionId`, `reservationIds` to localStorage
- **Real-time hook**: `artifacts/leena/src/hooks/useRealTimeStock.ts` — updates React Query cache + cart items + toasts on socket events
- **Seed script**: `artifacts/api-server/scripts/seed-quick.mjs`

## Architecture decisions

- **MongoDB standalone** (no replica set) → atomic single-document `$inc` updates with rollback, no transactions
- **Reservation TTL: 15 min** — cleanup job runs every 60 s in `index.ts`; timer in checkout extends once at 5-min mark
- **Socket.io broadcasts per-size** `stockUpdate` events; frontend's `useRealTimeStock` hook updates React Query + cart embedded product data
- **Cart persists sessionId + reservationIds** via `localStorage` (key `sw_cart_v2`) — checkout survives page refresh
- **Order creation confirms reservations** atomically in `orderController`; falls back to direct stock decrement if reservations expired
- **`releaseStock` is idempotent** — safe to call multiple times; already-released reservations return `true`
- **Firebase auth is optional** — auth features gracefully disabled if Firebase env vars are absent

## Product

- Browse products with live "X IN STOCK" / "ONLY X LEFT" / "OUT OF STOCK" badges
- Product detail page: per-size stock display, real-time availability
- Cart: live stock badges per line item, flash animation when stock drops, stock-issues banner blocks checkout
- Checkout: 15-min reservation timer, TTL refresh at 5-min mark, `beforeunload` releases reservations
- Payments: Razorpay (cards/UPI/netbanking/wallets) + COD
- Order success / payment failure pages with proper reservation confirm/release

## Gotchas

- Run `node artifacts/api-server/scripts/seed-quick.mjs` if products disappear (MongoDB TTL or accidental drop)
- `available = sizeCounts[size] - sizeReservedCounts[size]` — always use both fields for real availability
- `useRealTimeStock()` must be called in EVERY page that displays stock (ShopPage, ProductDetailPage, CartPage, CheckoutPage)
- The cart store key is `sw_cart_v2` — changing it clears all user carts
- Firebase vars (`VITE_FIREBASE_*`) are needed for auth; without them, login/auth features are disabled but browsing works

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
