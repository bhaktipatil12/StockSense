import type { OperationType } from "../operations/operation.types";

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
