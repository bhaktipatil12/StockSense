export type OperationType = "receipt" | "delivery" | "transfer" | "adjustment";
export type OperationStatus = "Draft" | "Waiting" | "Ready" | "Done" | "Canceled";

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

export type NewOperation = Pick<Operation, "type" | "contact" | "sourceLocationId" | "destinationLocationId" | "scheduledAt" | "lines" | "reason">;
