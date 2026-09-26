"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, loadInventory, operationPayload } from "../lib/inventory-api";
import type { ActionResult, DemoState, Location, NewOperation, Product, Warehouse } from "../types/inventory";

type Action = Promise<ActionResult>;
interface InventoryContextValue {
  state: DemoState;
  refresh: () => Promise<void>;
  addProduct: (product: Omit<Product, "id">, opening?: { locationId: string; quantity: number }) => Action;
  updateProduct: (id: string, product: Omit<Product, "id">) => Action;
  addCategory: (name: string, parentId?: string) => Action;
  updateCategory: (id: string, name: string, parentId?: string) => Action;
  deleteCategory: (id: string) => Action;
  updateProfile: (name: string) => Action;
  addWarehouse: (warehouse: Omit<Warehouse, "id">) => Action;
  updateWarehouse: (id: string, warehouse: Omit<Warehouse, "id">) => Action;
  deleteWarehouse: (id: string) => Action;
  addLocation: (location: Omit<Location, "id">) => Action;
  updateLocation: (id: string, location: Omit<Location, "id">) => Action;
  deleteLocation: (id: string) => Action;
  createOperation: (input: NewOperation) => Promise<{ result: ActionResult; id?: string }>;
  updateOperation: (id: string, input: NewOperation) => Action;
  markReady: (id: string) => Action;
  markPacked: (id: string) => Action;
  complete: (id: string) => Action;
  cancel: (id: string) => Action;
}

const emptyState: DemoState = { profileName: "", profileEmail: "", categories: [], products: [], warehouses: [], locations: [], operations: [], movements: [], balances: [] };
const InventoryContext = createContext<InventoryContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<DemoState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setState(await loadInventory()); setError(null); }
    catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { router.replace("/login"); return; }
      setError(cause instanceof Error ? cause.message : "Could not load inventory.");
    } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function perform<T>(request: () => Promise<T>, message: string): Promise<{ result: ActionResult; value?: T }> {
    try { const value = await request(); await refresh(); return { result: { ok: true, message }, value }; }
    catch (cause) { return { result: { ok: false, message: cause instanceof Error ? cause.message : "Request failed." } }; }
  }
  function productBody(product: Omit<Product, "id">) {
    return { sku: product.sku.trim().toUpperCase(), name: product.name.trim(), category_id: state.categories.find((item) => item.name === product.category)?.id ?? null, unit: product.unit, reorder_point: product.reorderPoint, unit_cost: product.unitCost ?? null };
  }
  async function addProduct(product: Omit<Product, "id">, opening?: { locationId: string; quantity: number }): Action {
    if (!product.name.trim() || !product.sku.trim()) return { ok: false, message: "Enter a product name and SKU." };
    if (opening && (opening.quantity < 0 || (opening.quantity > 0 && !opening.locationId))) return { ok: false, message: "Choose a valid opening location and quantity." };
    const created = await perform(() => api<{ id: string }>("/products", "POST", productBody(product)), "Product added.");
    if (!created.result.ok || !created.value || !opening?.quantity) return created.result;
    const operation = await perform(() => api<{ id: string }>("/operations", "POST", operationPayload({ type: "receipt", contact: "Opening stock", destinationLocationId: opening.locationId, scheduledAt: new Date().toISOString().slice(0, 10), lines: [{ productId: created.value!.id, quantity: opening.quantity }] })), "Opening receipt created.");
    if (!operation.result.ok || !operation.value) return { ok: false, message: `Product created, but opening stock failed: ${operation.result.message}` };
    const ready = await perform(() => api(`/operations/${operation.value!.id}/ready`, "POST"), "Ready");
    if (!ready.result.ok) return ready.result;
    return (await perform(() => api(`/operations/${operation.value!.id}/complete`, "POST"), "Product and opening stock added.")).result;
  }
  async function updateProduct(id: string, product: Omit<Product, "id">): Action { return (await perform(() => api(`/products/${id}`, "PATCH", productBody(product)), "Product updated.")).result; }
  async function addCategory(name: string): Action { return (await perform(() => api("/products/categories", "POST", { name: name.trim() }), "Category added.")).result; }
  async function updateCategory(id: string, name: string): Action { return (await perform(() => api(`/products/categories/${id}`, "PATCH", { name: name.trim() }), "Category updated.")).result; }
  async function deleteCategory(id: string): Action { return (await perform(() => api(`/products/categories/${id}`, "DELETE"), "Category deleted.")).result; }
  async function updateProfile(name: string): Action { return (await perform(() => api("/auth/me", "PATCH", { name: name.trim() }), "Profile updated.")).result; }
  async function addWarehouse(warehouse: Omit<Warehouse, "id">): Action { return (await perform(() => api("/warehouses", "POST", warehouse), "Warehouse added.")).result; }
  async function updateWarehouse(id: string, warehouse: Omit<Warehouse, "id">): Action { return (await perform(() => api(`/warehouses/${id}`, "PATCH", { name: warehouse.name, address: warehouse.address }), "Warehouse updated.")).result; }
  async function deleteWarehouse(id: string): Action { return (await perform(() => api(`/warehouses/${id}`, "DELETE"), "Warehouse removed.")).result; }
  async function addLocation(location: Omit<Location, "id">): Action { return (await perform(() => api("/warehouses/locations", "POST", { warehouse_id: location.warehouseId, code: location.code, name: location.name }), "Location added.")).result; }
  async function updateLocation(id: string, location: Omit<Location, "id">): Action { return (await perform(() => api(`/warehouses/locations/${id}`, "PATCH", { name: location.name }), "Location updated.")).result; }
  async function deleteLocation(id: string): Action { return (await perform(() => api(`/warehouses/locations/${id}`, "DELETE"), "Location removed.")).result; }
  async function createOperation(input: NewOperation): Promise<{ result: ActionResult; id?: string }> {
    if (!input.lines.length || input.lines.some((line) => !line.productId || line.quantity < 0 || (input.type !== "adjustment" && line.quantity === 0))) return { result: { ok: false, message: "Add a product and a valid quantity." } };
    const created = await perform(() => api<{ id: string }>("/operations", "POST", operationPayload(input)), "Draft created.");
    return { result: created.result, id: created.value?.id };
  }
  async function updateOperation(id: string, input: NewOperation): Action { return (await perform(() => api(`/operations/${id}`, "PATCH", operationPayload(input)), "Draft updated.")).result; }
  async function markReady(id: string): Action { return (await perform(() => api(`/operations/${id}/ready`, "POST"), "Document checked for stock.")).result; }
  async function markPacked(id: string): Action { return (await perform(() => api(`/operations/${id}/packing`, "POST"), "Picking and packing confirmed.")).result; }
  async function complete(id: string): Action { return (await perform(() => api(`/operations/${id}/complete`, "POST"), "Stock movement posted.")).result; }
  async function cancel(id: string): Action { return (await perform(() => api(`/operations/${id}/cancel`, "POST"), "Document canceled.")).result; }

  if (loading) return <div className="flex min-h-dvh items-center justify-center bg-white text-sm text-ink-muted">Loading inventory…</div>;
  if (error) return <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-white px-6 text-center"><p role="alert" className="text-sm text-bad-ink">{error}</p><button type="button" className="rounded-md border border-border px-4 py-2 text-sm" onClick={() => { setLoading(true); void refresh(); }}>Try again</button></div>;
  return <InventoryContext.Provider value={{ state, refresh, addProduct, updateProduct, addCategory, updateCategory, deleteCategory, updateProfile, addWarehouse, updateWarehouse, deleteWarehouse, addLocation, updateLocation, deleteLocation, createOperation, updateOperation, markReady, markPacked, complete, cancel }}>{children}</InventoryContext.Provider>;
}

export function useDemo(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("Inventory context is unavailable");
  return context;
}
