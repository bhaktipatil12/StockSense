# StockSense database design

Target: PostgreSQL, using transactions and exact numeric quantities. This is a design specification, not a claim that PostgreSQL is required by Odoo. Prefer a familiar database with real transactional guarantees if the team cannot deploy PostgreSQL today. See product.md for workflow meaning.

## Mental model and source of truth

A product is what moves. A location is where it sits. An operation records intent; its lines specify product/quantity. A balance row gives fast current on-hand and reserved figures. An append-only movement ledger explains *posted* changes. Both balance and ledger change atomically. A ledger is not a convenient place to store drafts. A transfer creates two equal and opposite ledger entries linked to one operation line; aggregating all movements for product/location must reconcile to on-hand.

**Free to use = on_hand − reserved** at each product/location. Ready delivery/transfer reserves stock; completion decreases both on_hand and reserved. Receipt completion increases on_hand. Adjustment changes on_hand; a count below currently reserved quantity must be rejected or resolved before posting. Source balances never become negative.

## Entity map

| Entity | Essential fields and constraints | Purpose |
| --- | --- | --- |
| `users` | UUID PK; unique normalized email and login ID; password hash; role; active; created timestamp | Authentication and actor |
| `password_reset_challenges` | user FK; hashed OTP; expiry; attempts; consumed timestamp | Short-lived reset; purge old entries |
| `warehouses` | UUID PK; unique short code; name; address; active | Top-level sites |
| `locations` | UUID PK; warehouse FK; code unique **within warehouse**; name; active; optional default flag | Actual stock holding places |
| `categories` | UUID PK; unique name | Catalog grouping |
| `products` | UUID PK; globally unique normalized SKU; name; category FK; unit; reorder point decimal; optional unit cost; active | Stable catalog identity |
| `stock_balances` | PK `(product_id, location_id)`; on_hand decimal ≥ 0; reserved decimal ≥ 0; reserved ≤ on_hand; version bigint | Locked, fast current availability |
| `operations` | UUID PK; unique friendly reference scoped appropriately; type RECEIPT/DELIVERY/TRANSFER/ADJUSTMENT; status; source/destination location FK nullable; supplier/customer fields; scheduled timestamp; responsible/creator FKs; posted timestamp; timestamps/version | Document lifecycle |
| `operation_lines` | UUID PK; operation FK; product FK; requested quantity decimal > 0; adjustment counted quantity if applicable; snapshot of observed balance/version; required adjustment reason | Multi-product documents; single-product count lines |
| `stock_movements` | UUID PK; unique `(operation_line_id, leg)`; product/location FKs; signed delta decimal ≠ 0; leg IN/OUT/ADJUST/OPEN; actor FK; posted timestamp | Immutable audit trail |
| `reservation_lines` | operation line FK + product/location; quantity decimal > 0; unique per operation line/source | Links reserved amounts to Ready outgoing documents |

Use a separate `opening_stock` operation/line and movement for initial stock; never insert a balance without a matching posted movement. An optional `organizations` FK on all tables is appropriate only if this app supports multiple independent businesses. If implemented, include org ID on uniqueness and authorization predicates to prevent cross-tenant leakage.

## Referential and state invariants

- A receipt has destination but no internal source; a delivery has source; a transfer has source and destination and they differ; adjustment has one location. Enforce type-specific fields in service validation and, if feasible, database CHECK constraints.
- Lines reference active products with positive quantity and valid unit increments. Existing historical operations retain product names/SKUs through snapshots if products can later be renamed; do not delete products with history.
- One operation may have several lines. `operation_lines` is unique by `(operation_id, product_id)` for simple flows, or permits repeated product with different lots only when lot tracking exists. Do not include lot tracking speculatively.
- A transfer line emits exactly two movements, one negative at source and one positive at destination; both post in one transaction. For receipt and delivery, exactly one movement per line. Adjustment delta of zero may complete with a count record and no movement; do not insert a zero movement.
- Done operations cannot change type, lines, quantities or locations. Posted movements cannot be edited or deleted. Corrections use new operations.
- Documents are owned by the warehouse derived from their location(s). Validate that location IDs belong to the intended warehouse. Do not use arbitrary text `From`/`To` as authoritative stock coordinates.
- Use timestamps with timezone (UTC storage); display warehouse/user timezone. Document reference numbers are generated in a transaction with a database sequence or dedicated counter row. Reference gaps are acceptable; never calculate `MAX(reference) + 1` under concurrency.

## Transaction algorithms

### Mark outgoing operation Ready

Within one transaction: lock the operation; require Draft or Waiting. Sum repeated product/location demands. Lock matching balance rows in a deterministic `(product_id, location_id)` order, creating missing zero rows safely if necessary. Check `on_hand - reserved >= requested`. If insufficient, mark Waiting, do not reserve, and return exact shortages. Otherwise insert reservation records, increase reserved, increment balance versions, mark Ready, commit. Repeated Ready requests on Ready return existing state. Editing a Ready document first releases reservations transactionally, returns to Draft, then applies edit. Simpler hackathon option: forbid edits while Ready and ask user to return to Draft explicitly.

### Complete a receipt

BEGIN; lock operation row; if Done, return saved result. Require Ready, verify its lines and destination; lock balance rows in deterministic order; insert one +quantity movement per line with unique `(operation_line_id, leg)`; increase on_hand; set status Done and posted_at; COMMIT. Any failure rolls back all changes. Repeated calls do not insert movements. An explicit idempotency key can protect document creation retries, but unique movements plus locked status protect completion.

### Complete a delivery

BEGIN; lock operation row; if Done return saved result; require Ready; lock source balances in deterministic order; verify reservation records exactly match lines and quantity; confirm pick/pack if the UI offers those actions; insert −quantity movements; decrease both on_hand and reserved; remove/mark consumed reservation rows; set Done; COMMIT. A Waiting document cannot complete. A reservation gives this document the right to its reserved units while other documents may only use free units.

### Complete a transfer

Use delivery checks at source. In one transaction, lock source and destination balances in deterministic order; verify reservations; insert linked −quantity and +quantity movements; decrease source on_hand/reserved and increase destination on_hand; mark Done. Do not commit source and destination separately. This keeps company total unchanged.

### Post a physical count

When opening the form, return on_hand, reserved and balance version. On post, lock operation and balance; compare the recorded version/quantity observed by the user with current row. If changed, return STALE_COUNT with current value and require review. Check counted ≥ reserved (or explicitly resolve reservations). Insert signed adjustment movement if delta nonzero; set on_hand to count; update version; mark Done; commit. Adjustment reason and actor are required. Draft edits do not affect stock.

### Cancel

Lock operation. Done cannot cancel. If Ready outgoing, lock balances, release exactly this operation's reservations, reduce reserved, mark Canceled in same transaction. Waiting/Draft cancel without changing stock. A receipt Ready has no reservation. Repeating cancel returns existing Canceled state.

## Concurrency and retries

Use database row locks such as `SELECT ... FOR UPDATE` on document and balance rows, or guarded atomic UPDATEs whose affected-row count is checked. Never read availability outside the transaction and assume it remains valid. Lock rows in the same sorted order for all operations to reduce deadlocks. If a deadlock or serialization failure occurs, retry the **whole transaction** with a small bound; never retry only a movement insert. The unique movement key plus operation status ensures retries cannot double-post. Two deliveries competing for the final 10 units: at most one obtains enough free stock or reservation; the other receives an explicit shortage. For create requests, accept an idempotency key with unique `(actor_id, key, endpoint)` if clients retry on network failure.

Never cache stock quantities as the authoritative source in the frontend. Refresh after mutation; an optimistic preview must reconcile to server result. Reconciliation query should show discrepancies between `SUM(stock_movements.delta)` and stock_balances.on_hand (accounting for all posted opening movements). Run it during development and demo checks. Reserve amounts reconcile against active `reservation_lines`.

## Indexes and practical scalability

- Unique: `products(sku_normalized)`, `users(email_normalized)`, `users(login_normalized)`, `warehouses(code)`, `locations(warehouse_id, code)`, `stock_movements(operation_line_id, leg)`; unique operation reference within chosen scope.
- Listing: `operations(type, status, scheduled_at DESC)`, `operations(source_location_id, status)`, `operations(destination_location_id, status)`, `stock_movements(product_id, posted_at DESC)`, `stock_movements(location_id, posted_at DESC)`, `stock_movements(operation_line_id)` and `stock_balances(location_id, product_id)`.
- Search: normalized exact SKU via B-tree; product-name prefix or trigram only if needed and supported. Query filter columns server-side; paginate by a stable `(created_at, id)` cursor or a sensible page size. Never load the whole ledger to filter in the browser.
- Dashboard: indexed SQL counts for MVP. Add summary tables/materialized views only after measuring a real bottleneck. Do not introduce distributed services for an eight-hour app.
- Low stock: compare total or per-warehouse balance against a clearly named reorder threshold; choose one semantic and label it. A threshold of 0 can mean alerts disabled if explicitly documented.
- Optional product unit cost is metadata; do not sum costs or imply financial valuation without inventory accounting rules.

## Security and migration

Password hash using a reputable password-hashing library; never reversible encryption. OTP stored only as a hash, expires, rate-limited by account/IP, one-time use, and responses avoid revealing whether an email exists. All writes require authenticated server-side permission; validate UUIDs, quantities, lengths and allowed transitions. Use prepared queries/ORM parameterization. Do not log credentials, OTP or customer addresses. Keep schema as versioned migrations and a deterministic, non-production seed script. Back up data if deployed; ledger integrity depends on database durability.

## Verification scenarios

1. Receipt with two products posts two movements and balances; retry completion changes nothing.
2. Delivery exceeding free quantity fails with no partial movement or status change.
3. Two competing deliveries for the last quantity cannot both reserve/complete.
4. Transfer posts equal opposite movements and preserves total, even when source/destination differ across warehouses.
5. Ready outgoing cancellation releases its reservation; another order can use the stock.
6. Concurrent stock change makes a pending physical count stale; the count is not silently posted.
7. A failed movement insert rolls back status and all balance changes.
8. Ledger sums and balance values reconcile after opening stock, receipt, transfer, delivery and adjustment.
