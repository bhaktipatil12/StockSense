import type { DemoState, Operation, OperationType } from "../types/inventory";

export function onHand(state: DemoState, productId: string, locationId: string): number {
  return state.movements
    .filter((movement) => movement.productId === productId && movement.locationId === locationId)
    .reduce((total, movement) => total + movement.quantity, 0);
}

export function reserved(state: DemoState, productId: string, locationId: string): number {
  return state.operations
    .filter((operation) => operation.status === "Ready" && operation.type !== "receipt" && operation.sourceLocationId === locationId)
    .flatMap((operation) => operation.lines)
    .filter((line) => line.productId === productId)
    .reduce((total, line) => total + line.quantity, 0);
}

export function available(state: DemoState, productId: string, locationId: string): number {
  return onHand(state, productId, locationId) - reserved(state, productId, locationId);
}

export function totalOnHand(state: DemoState, productId: string): number {
  return state.locations.reduce((total, location) => total + onHand(state, productId, location.id), 0);
}

export function totalAvailable(state: DemoState, productId: string): number {
  return state.locations.reduce((total, location) => total + available(state, productId, location.id), 0);
}

export function locationName(state: DemoState, id?: string): string {
  const location = state.locations.find((item) => item.id === id);
  if (!location) return "—";
  const warehouse = state.warehouses.find((item) => item.id === location.warehouseId);
  return warehouse ? `${warehouse.code} / ${location.name}` : location.name;
}

export function productName(state: DemoState, id: string): string {
  return state.products.find((product) => product.id === id)?.name ?? "Unknown product";
}

export function operationPath(operation: Pick<Operation, "id" | "type">): string {
  const segment = { receipt: "receipts", delivery: "deliveries", transfer: "transfers", adjustment: "adjustments" }[operation.type];
  return `/operations/${segment}/${operation.id}`;
}

export function operationLabel(type: OperationType): string {
  return { receipt: "Receipt", delivery: "Delivery", transfer: "Internal transfer", adjustment: "Adjustment" }[type];
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}
