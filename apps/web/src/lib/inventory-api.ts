import type { DemoState, NewOperation, Operation, Product } from "../types/inventory";

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/backend${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch { throw new ApiError("Inventory server is unavailable.", 503); }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload ? payload.detail : null;
    const message = typeof detail === "string" ? detail : "The request could not be completed.";
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

interface ApiUser { name: string; email: string }
interface ApiCategory { id: string; name: string }
interface ApiProduct { id: string; sku: string; name: string; category_id: string | null; unit: string; reorder_point: number; unit_cost: number | null }
interface ApiWarehouse { id: string; code: string; name: string; address: string }
interface ApiLocation { id: string; warehouse_id: string; code: string; name: string }
interface ApiLine { product_id: string; quantity: number; counted_quantity: number | null; observed_on_hand: number | null; reason: string | null }
interface ApiOperation { id: string; reference: string; type: string; status: string; supplier: string | null; customer: string | null; notes: string | null; source_location_id: string | null; destination_location_id: string | null; scheduled_at: string | null; created_at: string; pick_confirmed: boolean; pack_confirmed: boolean; lines: ApiLine[] }
interface ApiMovement { id: string; operation_line_id: string; product_id: string; location_id: string; delta: number; posted_at: string; actor_name: string | null; operation_reference: string | null; operation_type: string | null }
interface ApiBalance { product_id: string; location_id: string; on_hand: number; reserved: number }

export async function loadInventory(): Promise<DemoState> {
  const [user, categories, products, warehouses, locations, operations, movements, balances] = await Promise.all([
    api<ApiUser>("/auth/me"), api<ApiCategory[]>("/products/categories"), api<ApiProduct[]>("/products"),
    api<ApiWarehouse[]>("/warehouses"), api<ApiLocation[]>("/warehouses/locations"),
    api<ApiOperation[]>("/operations"), api<ApiMovement[]>("/movements?limit=500"), api<ApiBalance[]>("/stock/balances"),
  ]);
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const operationByLine = new Map(operations.flatMap((operation) => operation.lines.map((line) => [line.product_id, operation.id] as const)));
  return {
    profileName: user.name || "Inventory user", profileEmail: user.email,
    categories: categories.map((item) => ({ id: item.id, name: item.name })),
    products: products.map((item) => ({ id: item.id, sku: item.sku, name: item.name, category: categoryName.get(item.category_id ?? "") ?? "Uncategorized", unit: item.unit as Product["unit"], reorderPoint: item.reorder_point, unitCost: item.unit_cost ?? undefined })),
    warehouses: warehouses.map((item) => ({ id: item.id, code: item.code, name: item.name, address: item.address })),
    locations: locations.map((item) => ({ id: item.id, warehouseId: item.warehouse_id, code: item.code, name: item.name })),
    operations: operations.map((item): Operation => ({
      id: item.id, reference: item.reference, type: item.type.toLowerCase() as Operation["type"],
      status: ({ DRAFT: "Draft", WAITING: "Waiting", READY: "Ready", DONE: "Done", CANCELED: "Canceled" } as Record<string, Operation["status"]>)[item.status] ?? "Draft",
      contact: item.supplier ?? item.customer ?? item.notes ?? "Internal", sourceLocationId: item.source_location_id ?? undefined,
      destinationLocationId: item.destination_location_id ?? undefined, scheduledAt: item.scheduled_at?.slice(0, 10) ?? item.created_at.slice(0, 10),
      createdAt: item.created_at.slice(0, 10), responsible: user.name || "Inventory user", packed: item.pick_confirmed && item.pack_confirmed,
      reason: item.notes ?? undefined, countBaseline: item.lines[0]?.observed_on_hand ?? undefined,
      lines: item.lines.map((line) => ({ productId: line.product_id, quantity: item.type === "ADJUSTMENT" ? line.counted_quantity ?? line.quantity : line.quantity })),
    })),
    movements: movements.map((item) => ({ id: item.id, reference: item.operation_reference ?? "", operationId: operationByLine.get(item.product_id), type: (item.operation_type?.toLowerCase() ?? "adjustment") as Operation["type"], productId: item.product_id, locationId: item.location_id, quantity: item.delta, at: item.posted_at.slice(0, 10), actor: item.actor_name ?? "Inventory user" })),
    balances: balances.map((item) => ({ productId: item.product_id, locationId: item.location_id, onHand: item.on_hand, reserved: item.reserved })),
  };
}

export function operationPayload(input: NewOperation) {
  return {
    type: input.type.toUpperCase(), source_location_id: input.sourceLocationId || null,
    destination_location_id: input.destinationLocationId || null,
    supplier: input.type === "receipt" ? input.contact : null,
    customer: input.type === "delivery" ? input.contact : null,
    notes: input.reason || (input.type === "transfer" ? input.contact : null),
    scheduled_at: input.scheduledAt ? `${input.scheduledAt}T12:00:00` : null,
    lines: input.lines.map((line) => ({ product_id: line.productId, quantity: input.type === "adjustment" ? 1 : line.quantity, counted_quantity: input.type === "adjustment" ? line.quantity : null, reason: input.type === "adjustment" ? input.reason : null })),
  };
}
