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
