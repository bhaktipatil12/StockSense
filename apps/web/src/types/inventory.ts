export type OperationType = "receipt" | "delivery" | "transfer" | "adjustment";
export type OperationStatus = "Draft" | "Waiting" | "Ready" | "Done" | "Canceled";
export type Unit = "pcs" | "kg" | "m" | "box";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: Unit;
  reorderPoint: number;
  unitCost?: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
}

export interface Location {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
}

export interface OperationLine {
  productId: string;
  quantity: number;
}

export interface Operation {
  id: string;
  reference: string;
  type: OperationType;
  status: OperationStatus;
  contact: string;
  sourceLocationId?: string;
  destinationLocationId?: string;
  scheduledAt: string;
  createdAt: string;
  responsible: string;
  lines: OperationLine[];
  packed?: boolean;
  reason?: string;
  countBaseline?: number;
}

export interface Movement {
  id: string;
  reference: string;
  operationId?: string;
  type: OperationType | "opening";
  productId: string;
  locationId: string;
  quantity: number;
  at: string;
  actor: string;
}

export interface DemoState {
  profileName: string;
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
  operations: Operation[];
  movements: Movement[];
}

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export type NewOperation = Pick<Operation, "type" | "contact" | "sourceLocationId" | "destinationLocationId" | "scheduledAt" | "lines" | "reason">;
