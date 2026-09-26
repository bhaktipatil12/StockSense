import type { Product } from "./catalog/product.types";
import type { Location, Warehouse } from "./locations/location.types";
import type { Movement } from "./movements/movement.types";
import type { Operation } from "./operations/operation.types";

export type { Product, Unit } from "./catalog/product.types";
export type { Location, Warehouse } from "./locations/location.types";
export type { Movement } from "./movements/movement.types";
export type { Operation, OperationLine, OperationStatus, OperationType, NewOperation } from "./operations/operation.types";

export interface DemoState {
  profileName: string;
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
  operations: Operation[];
  movements: Movement[];
}

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

