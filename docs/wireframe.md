# StockSense wireframe and interface specification

Source: StockSense.pdf and the 11 supplied screenshots of the linked Excalidraw wireframe, reviewed 26 September 2026. The live Excalidraw URL could not be retrieved in the research tool, so this maps the supplied screenshots and PDF. The screenshots are structural sketches, not a visual theme. Apply ODOO_DESIGN_LANGUAGE.md for visual implementation.

## Shared shell and navigation

Wireframe top navigation: Dashboard, Operations, Products/Stock, Move History, Settings, profile button. Implement a clean desktop rail or restrained top navigation based on viewport; choose one consistent pattern. Operations contains Receipts, Deliveries, Internal Transfers, and Adjustments. Settings contains Warehouses and Locations. Profile menu contains My Profile and Logout. Keep each route bookmarked and browser Back functional. Narrow screens use labeled menu navigation. Avoid giant empty framed areas in the sketches: use task-focused content and sensible whitespace.

| Route | Primary purpose | Main action |
| --- | --- | --- |
| `/dashboard` | What requires action now | Open relevant filtered operation |
| `/products` | Find products and inspect stock | Add product |
| `/products/:id` | Product, per-location balances, reorder rule | Edit product |
| `/operations/receipts` | Incoming documents | New receipt |
| `/operations/deliveries` | Outgoing documents | New delivery |
| `/operations/transfers` | Moves between locations | New transfer |
| `/operations/adjustments` | Physical count corrections | New adjustment |
| `/operations/:type/:id` | Review, edit, advance, validate a document | Contextual next action |
| `/moves` | Audit completed stock movements | Filter/search |
| `/settings/warehouses` | Warehouse records | Add warehouse |
| `/settings/locations` | Physical storage locations | Add location |
| `/profile` | Account details | Save changes |

## 1. Authentication (screenshots 2–3)

Login: brand wordmark, login ID or email, password, Sign in, Forgot password, Sign up. Incorrect credentials receive a generic inline message, not an account-existence hint. Signup: unique login ID (wireframe says 6–12 characters), unique email, password, confirmation, Submit. The sketch's complexity rule requests uppercase, lowercase, special character and length greater than eight; implement and show the exact rule before submission if using it. Do not trim passwords or impose undocumented rules. Forgot-password flow requests email, sends a short-lived single-use OTP, verifies OTP, then updates password and invalidates sessions if supported. Do not show OTP in UI or logs. Provide rate limiting and a development mail sink if live email is unavailable; do not claim email was sent when it was not. Auth state persists securely with server-side authorization.

## 2. Dashboard (screenshot 4 + PDF)

Wireframe shows two summary regions: Receipts with count to receive; Deliveries with count to deliver and late/waiting counts. PDF additionally requires Total Products in Stock, Low/Out of Stock, Pending Receipts, Pending Deliveries, and Internal Transfers Scheduled. Implement a concise operational overview: a clearly labeled metric row followed by prioritized 'Needs attention' lists for late/waiting receipts and deliveries. Each number opens a filtered list. State definitions must be precise: pending excludes done/canceled; late means scheduled date before today in the warehouse's selected timezone and not done/canceled. Filters: document type, status, warehouse/location, category. Display an empty state, not five zero-value decorative cards.

## 3. Products and stock (screenshot 5)

The sketch's stock table shows Product, Per unit cost, On hand, Free to use and says users can update stock there. PDF's mandatory product fields are name, unique SKU, category, unit of measure, optional initial stock. Unit cost is in the sketch, so include it as optional metadata if time permits; it does not affect quantity. Table should show SKU/name, category, unit, on hand, reserved, free to use, reorder threshold, and actionable low-stock label. Search SKU/name; optionally filter category/warehouse. Selecting a row opens product detail with balances by location and latest movements. 'Update stock' opens a count adjustment with recorded quantity prefilled; never directly mutate a balance from an editable table cell. Initial stock creates a logged opening adjustment. Preserve the product's unit on all operation lines; do not silently mix kg with pieces.

## 4. Warehouses and locations (screenshots 6–7)

Warehouse fields: unique short code, name, address. A warehouse owns one or more storage locations. Location fields: unique short code within warehouse, name, owning warehouse; optional description (rack/room/floor). Show warehouse and nested locations with add/edit controls. Stock is held at a location, not only at the warehouse. Every active warehouse gets an explicit default receiving/storage location so small workflows remain fast. Do not delete a location containing stock or referenced by an operation; deactivate it instead.

## 5. Operation list pages (screenshots 8–9 and delivery list)

Receipts and deliveries sketches default to list view, allow search by reference/contact, show reference, From, To, contact, scheduled date and status, and offer list/kanban switch. Implement a useful list first. Status board is optional after the core flows work; if built, use the same filtered dataset and keyboard-accessible controls. Avoid drag-and-drop as the only way to change status. Rows open the detail page. Receipts: supplier → warehouse location. Deliveries: warehouse location → customer. Transfers: source → destination. Adjustments: counted location. List filters: status, warehouse/location, date, type and category where relevant. Ref values should be generated by the server and unique; illustrative wireframe pattern `WH/IN/0001`/`WH/OUT/0001` is not a guarantee of global uniqueness across warehouses. Use an internal UUID and display a friendly warehouse-scoped reference. A document with multiple products remains one list row; the detail shows its lines.

Move History sketch includes New and list/kanban controls. Interpret history as a read-only ledger of posted movements. Put 'New' on the appropriate operation list rather than creating an arbitrary ledger entry. Filter by reference, SKU/product, contact, date, source, destination, warehouse and operation type. Show signed quantity or explicit direction together with from/to, status Done and timestamp. Never show only colors for in/out. A reference with several product lines expands to distinct movement lines on detail.

## 6. Receipt detail (screenshot 10)

Header: generated reference, status sequence, actions. Fields: supplier, destination warehouse/location, scheduled date, responsible user (defaults to signed-in user), product lines with positive quantities. Flow: Draft → Ready → Done, with Cancel from Draft/Ready. Use 'Mark ready' then 'Receive stock' as contextual actions, rather than one ambiguous Validate button for both transitions. Receipt becomes Done and increases on-hand only when 'Receive stock' succeeds. The sketch permits Print when Done; implement a simple printable receipt if time remains. All changes and the resulting balances must be visible afterward.

## 7. Delivery detail (last screenshot)

Header: generated reference, status and contextual actions. Fields: customer/delivery address, source location, schedule date, responsible user, product lines, optional operation type. Flow: Draft → Waiting (insufficient stock) or Ready (stock can be reserved) → Done, with Cancel before Done. Explain unavailable quantities at the affected line; do not merely turn the row red or show a generic alert. A Ready delivery reserves quantities; on Done it consumes that reservation and reduces on-hand. If stock changes while a user edits the page, server validation remains authoritative. Pick/pack can be two explicit checklist states or one simple confirmation if time is short; do not claim those steps occurred automatically. Print a delivery note after Done if available.

## 8. Transfer and adjustment details (PDF extension)

Transfer: source and destination must differ; both are locations, possibly in distinct warehouses. Lines carry product and positive quantity. Draft/Waiting/Ready/Done/Cancelled as for delivery. Ready reserves source quantity. Done subtracts source, adds destination, and records two linked ledger entries. Company total remains unchanged.

Adjustment: choose location and product, show recorded quantity, input physical count and a required reason. Show calculated difference before confirmation. Posting sets balance to counted quantity and records signed delta. If balance changed after the count page loaded, reject and ask for a recount/review rather than overwriting a newer movement. Adjustments need not use a misleading Ready state; Draft → Done/Cancelled is sufficient.

## Microinteractions and small screens

Use the design-language motion rules: immediate press and focus feedback; localized pending action; preserve form input on errors; specific success text; briefly highlight changed balance/row. Reduce motion on request. Mobile: summary metrics stack, list rows become labeled records or a horizontally scrollable semantic table when comparing columns, line items use a focused editor, main validation action stays visible at the end. No generic CTA section, heavy shadow, gradients, decorative icon boxes or excessive cards.

## Source discrepancies resolved

- Wireframe stock table includes unit cost and 'free to use'; PDF does not require cost. Make cost optional; derive free as on-hand minus reserved.
- Wireframe says 'update stock from here'; route through a logged adjustment.
- Wireframe receipt uses 'Validate' for both Draft → Ready and Ready → Done. Give each transition an explicit verb.
- Wireframe moves view contains a 'New' button; ledger stays immutable and new activity originates from typed operations.
- Some wireframe example rows reverse From/To or mention manufacturing orders. Use consistent receipt/delivery direction; manufacturing integration is outside this PDF.
- Screenshot ink colors are sketch annotations, not the product palette. Use the supplied design language.
