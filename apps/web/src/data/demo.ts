import type { DemoState } from "../types/inventory";

export const initialDemoState: DemoState = {
  profileName: "Tanveer Singh",
  categories: [
    { id: "cat-furniture", name: "Furniture" },
    { id: "cat-raw", name: "Raw materials" },
    { id: "cat-components", name: "Components" },
    { id: "cat-finished", name: "Finished goods" },
  ],
  warehouses: [
    { id: "wh-main", code: "WH", name: "Main warehouse", address: "Hyderabad, Telangana" },
    { id: "wh-north", code: "NW", name: "North distribution", address: "Secunderabad, Telangana" },
  ],
  locations: [
    { id: "loc-main", warehouseId: "wh-main", code: "STOCK", name: "Main stock" },
    { id: "loc-prod", warehouseId: "wh-main", code: "PROD", name: "Production rack" },
    { id: "loc-north", warehouseId: "wh-north", code: "STOCK", name: "North stock" },
  ],
  products: [
    { id: "prod-rod", sku: "ROD-01", name: "Steel rod", category: "Raw materials", unit: "kg", reorderPoint: 20, unitCost: 82 },
    { id: "prod-desk", sku: "DSK-001", name: "Oak desk", category: "Furniture", unit: "pcs", reorderPoint: 12, unitCost: 3000 },
    { id: "prod-chair", sku: "CHR-014", name: "Task chair", category: "Furniture", unit: "pcs", reorderPoint: 15, unitCost: 1850 },
    { id: "prod-bolt", sku: "BLT-120", name: "Hex bolt M8", category: "Components", unit: "box", reorderPoint: 30, unitCost: 240 },
    { id: "prod-fabric", sku: "FAB-220", name: "Canvas roll", category: "Raw materials", unit: "m", reorderPoint: 25, unitCost: 135 },
    { id: "prod-lamp", sku: "LMP-008", name: "Desk lamp", category: "Finished goods", unit: "pcs", reorderPoint: 10, unitCost: 940 },
  ],
  operations: [
    { id: "op-r001", reference: "WH/IN/0001", type: "receipt", status: "Done", contact: "Aster Metals", destinationLocationId: "loc-main", scheduledAt: "2026-09-20", createdAt: "2026-09-19", responsible: "Tanveer Singh", lines: [{ productId: "prod-rod", quantity: 100 }, { productId: "prod-bolt", quantity: 80 }] },
    { id: "op-r002", reference: "WH/IN/0002", type: "receipt", status: "Ready", contact: "Northline Supply", destinationLocationId: "loc-main", scheduledAt: "2026-09-28", createdAt: "2026-09-24", responsible: "Tanveer Singh", lines: [{ productId: "prod-chair", quantity: 24 }] },
    { id: "op-r003", reference: "NW/IN/0001", type: "receipt", status: "Draft", contact: "Bright Components", destinationLocationId: "loc-north", scheduledAt: "2026-10-02", createdAt: "2026-09-25", responsible: "Tanveer Singh", lines: [{ productId: "prod-lamp", quantity: 18 }] },
    { id: "op-d001", reference: "WH/OUT/0001", type: "delivery", status: "Done", contact: "Harbor Works", sourceLocationId: "loc-main", scheduledAt: "2026-09-23", createdAt: "2026-09-21", responsible: "Tanveer Singh", lines: [{ productId: "prod-rod", quantity: 20 }], packed: true },
    { id: "op-d002", reference: "WH/OUT/0002", type: "delivery", status: "Ready", contact: "Orion Offices", sourceLocationId: "loc-main", scheduledAt: "2026-09-27", createdAt: "2026-09-25", responsible: "Tanveer Singh", lines: [{ productId: "prod-desk", quantity: 8 }], packed: false },
    { id: "op-d003", reference: "NW/OUT/0001", type: "delivery", status: "Waiting", contact: "Apex Retail", sourceLocationId: "loc-north", scheduledAt: "2026-09-24", createdAt: "2026-09-23", responsible: "Tanveer Singh", lines: [{ productId: "prod-lamp", quantity: 5 }] },
    { id: "op-t001", reference: "WH/INT/0001", type: "transfer", status: "Done", contact: "Internal", sourceLocationId: "loc-main", destinationLocationId: "loc-prod", scheduledAt: "2026-09-22", createdAt: "2026-09-21", responsible: "Tanveer Singh", lines: [{ productId: "prod-rod", quantity: 30 }] },
    { id: "op-t002", reference: "WH/INT/0002", type: "transfer", status: "Ready", contact: "Internal", sourceLocationId: "loc-main", destinationLocationId: "loc-prod", scheduledAt: "2026-09-30", createdAt: "2026-09-25", responsible: "Tanveer Singh", lines: [{ productId: "prod-bolt", quantity: 12 }] },
    { id: "op-a001", reference: "WH/ADJ/0001", type: "adjustment", status: "Done", contact: "Cycle count", sourceLocationId: "loc-main", scheduledAt: "2026-09-24", createdAt: "2026-09-24", responsible: "Tanveer Singh", lines: [{ productId: "prod-rod", quantity: 48 }], reason: "Damaged stock" },
  ],
  movements: [
    { id: "mov-1", reference: "OPEN/0001", type: "opening", productId: "prod-desk", locationId: "loc-main", quantity: 50, at: "2026-09-18", actor: "Tanveer Singh" },
    { id: "mov-2", reference: "OPEN/0002", type: "opening", productId: "prod-chair", locationId: "loc-main", quantity: 8, at: "2026-09-18", actor: "Tanveer Singh" },
    { id: "mov-3", reference: "OPEN/0003", type: "opening", productId: "prod-fabric", locationId: "loc-main", quantity: 42, at: "2026-09-18", actor: "Tanveer Singh" },
    { id: "mov-4", reference: "op-r001", operationId: "op-r001", type: "receipt", productId: "prod-rod", locationId: "loc-main", quantity: 100, at: "2026-09-20", actor: "Tanveer Singh" },
    { id: "mov-5", reference: "op-r001", operationId: "op-r001", type: "receipt", productId: "prod-bolt", locationId: "loc-main", quantity: 80, at: "2026-09-20", actor: "Tanveer Singh" },
    { id: "mov-6", reference: "op-t001", operationId: "op-t001", type: "transfer", productId: "prod-rod", locationId: "loc-main", quantity: -30, at: "2026-09-22", actor: "Tanveer Singh" },
    { id: "mov-7", reference: "op-t001", operationId: "op-t001", type: "transfer", productId: "prod-rod", locationId: "loc-prod", quantity: 30, at: "2026-09-22", actor: "Tanveer Singh" },
    { id: "mov-8", reference: "op-d001", operationId: "op-d001", type: "delivery", productId: "prod-rod", locationId: "loc-main", quantity: -20, at: "2026-09-23", actor: "Tanveer Singh" },
    { id: "mov-9", reference: "op-a001", operationId: "op-a001", type: "adjustment", productId: "prod-rod", locationId: "loc-main", quantity: -2, at: "2026-09-24", actor: "Tanveer Singh" },
  ],
};
