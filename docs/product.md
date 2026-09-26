# StockSense product specification

Source of requirements: StockSense.pdf, supplied Excalidraw screenshots, and project design language. Purpose: a centralized inventory application for managers and warehouse staff. Version: hackathon implementation, 26 September 2026.

## Product promise

A user can answer: **What do we have, where is it, how much is available, and why did it change?** A completed operation always leaves a durable history entry and produces a consistent balance. Product correctness matters more than the number of screens.

## Roles and permissions

| Role | Actions |
| --- | --- |
| Inventory manager | Manage products/categories/reorder levels, warehouses/locations, create and validate all operations, post adjustments, view history and dashboard |
| Warehouse staff | View stock, create/advance receipts, deliveries and transfers in assigned warehouse, record counts; manager approval for adjustment posting if roles can be implemented in time |

At minimum implement one authenticated role and server-side authorization on every mutation. Never trust a hidden button as a permission check. Do not claim granular roles unless enforced.

## Required functionality and acceptance checks

| Area | Minimum observable result |
| --- | --- |
| Auth | Signup, login, logout, password reset through a time-limited OTP sent through configured email or a clearly identified dev-only mail sink |
| Catalog | Unique SKU; create/edit product, category, unit, reorder threshold; optional opening stock logged |
| Locations | Create warehouse and child locations; read per-location balance |
| Receipt | Create document with supplier, destination, one or more lines; only successful completion increases on-hand once |
| Delivery | Create document with customer, source, lines; cannot complete beyond free stock; pick/pack confirmed; completion decreases on-hand once |
| Transfer | Source/destination distinct; completion changes both location balances atomically without changing total |
| Adjustment | Recorded vs counted quantity, reason, signed delta; stale counts cannot overwrite newer movements |
| History | Every opening balance and posted operation has immutable movement entries with actor, timestamp and document reference |
| Dashboard | Five PDF KPIs from database: total products in stock, low/out-of-stock items, pending receipts, pending deliveries, scheduled transfers |
| Discovery | SKU/name search; operation search and document type/status/warehouse/location/category filters |

## Core rules

1. Quantity is nonnegative, in the product's fixed unit, and stored as an exact decimal or integer base units. Never use binary floating point for balances. Choose a scale such as decimal(18,3) if kg/metres may occur; define allowed increments per unit.
2. A document is Draft until confirmed. Draft edits have no stock effect. A Ready outgoing document reserves stock; Waiting indicates stock is insufficient and reserves none. A receipt Ready can await physical arrival without affecting stock.
3. Completion is the single posting moment. Receipt adds stock; delivery consumes reserved stock; transfer consumes source reservation and adds destination; adjustment posts a signed difference.
4. Completion, ledger insert, status change and balance update happen in one database transaction. Retry or double-click returns the already completed outcome and cannot post twice.
5. No negative on-hand or negative free-to-use. Availability is per product and source location, never just a company total.
6. Only Draft/Waiting/Ready can be canceled. Cancel Ready outgoing documents releases reservations. A Done document is immutable; corrections require a new reversing/adjustment document, preserving history.
7. Read permissions are scoped to authorized warehouses if role scoping exists. Contact and address data is not exposed to unrelated accounts.
8. Filters and metrics apply consistent status meanings. Stock total is defined explicitly: count of distinct stocked products or sum of units is invalid across mixed units. Label KPI 'Products in stock' as distinct products with positive company-wide quantity; display per-unit quantities separately.

## End-to-end demo story

1. Manager signs in, creates Main Warehouse and Production location, plus product `ROD-01` (Steel Rod, kg), threshold 20.
2. Create receipt for 100 kg into Main, mark ready, receive. Dashboard and product balance show Main 100; ledger +100.
3. Create transfer of 30 kg Main → Production, mark ready, complete. Main 70, Production 30, company total 100; ledger has linked −30/+30.
4. Create delivery of 20 kg from Main, confirm pick/pack, complete. Main 50, Production 30, company total 80; ledger −20.
5. Count Main as 48 kg and post reason 'Damaged stock'. Main 48, Production 30, company total 78; ledger −2.
6. Repeat the receipt/delivery completion request. Nothing changes. Attempt to deliver 100 kg from Main; show available 48 and prevent completion.
7. Search `ROD-01`, filter history, inspect each operation and dashboard counts. Refresh and confirm values remain.

## Build order for today

- **Before 10:00 AM:** create and submit public repository through portal as instructed. Put a short README, schema, initial app, and first commit on main. Team members make their own commits. Select the problem statement in portal.
- **Foundation:** database migration; authentication using familiar setup; catalog, warehouse/location, stock balances and immutable ledger.
- **First vertical flow:** receipt create → ready → complete → persisted balance + history. Prove transaction/idempotency before adding other movement types.
- **Reuse flow:** delivery → transfer → adjustment. Keep source/destination and line models shared; never fork four incompatible stock calculations.
- **Interface:** lists, details, useful dashboard and filters; apply wireframe.md and ODOO_DESIGN_LANGUAGE.md.
- **Final hour:** verify clean startup, concurrent/out-of-stock and duplicate-post cases, mobile layout, record functional 5–6 minute demo and submit link per portal deadline.

A kanban view, printable documents, per-unit cost, detailed staff permissions and polished OTP delivery are secondary to working stock transactions. OTP reset is stated in the PDF, so document honestly if it is incomplete; never fake a sent OTP.

## API surface suggestion

`POST /auth/...`; `GET/POST/PATCH /products`; `GET/POST /warehouses` and `/locations`; `GET /stock?productId=&locationId=`; `GET/POST /operations?type=&status=...`; `GET/PATCH /operations/:id`; `POST /operations/:id/ready`; `POST /operations/:id/complete`; `POST /operations/:id/cancel`; `GET /movements`; `GET /dashboard`. Completion endpoints must check the stored status and execute atomically. Use a consistent JSON error with a user-safe code such as `INSUFFICIENT_STOCK`, `STALE_COUNT`, `INVALID_TRANSITION`, or `FORBIDDEN`.

## Done means

A newly cloned repo starts from documented environment variables and migrations. The core story above works from the UI against persisted data. Balances and ledger reconcile. Repeated completion and simultaneous competing deliveries cannot produce extra or negative stock. Inputs and errors are understandable, screens work on narrow widths, and the demo shows live changes rather than static JSON.
