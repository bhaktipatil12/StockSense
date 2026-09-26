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
