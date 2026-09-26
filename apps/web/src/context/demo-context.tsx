"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialDemoState } from "../data/demo";
import { available, onHand } from "../lib/inventory";
import type { ActionResult, DemoState, Location, NewOperation, Operation, Product, Warehouse } from "../types/inventory";

interface DemoContextValue {
  state: DemoState;
  addProduct: (product: Omit<Product, "id">, opening?: { locationId: string; quantity: number }) => ActionResult;
  updateProduct: (id: string, product: Omit<Product, "id">) => ActionResult;
  updateProfile: (name: string) => ActionResult;
  addWarehouse: (warehouse: Omit<Warehouse, "id">) => ActionResult;
  addLocation: (location: Omit<Location, "id">) => ActionResult;
  createOperation: (input: NewOperation) => { result: ActionResult; id?: string };
  markReady: (id: string) => ActionResult;
  markPacked: (id: string) => ActionResult;
  complete: (id: string) => ActionResult;
  cancel: (id: string) => ActionResult;
}

const DemoContext = createContext<DemoContextValue | null>(null);
const done = (message: string): ActionResult => ({ ok: true, message });
const fail = (message: string): ActionResult => ({ ok: false, message });

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem("stocksense-inventory-v1");
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && "products" in parsed && "warehouses" in parsed && "locations" in parsed && "operations" in parsed && "movements" in parsed && Array.isArray(parsed.products) && Array.isArray(parsed.warehouses) && Array.isArray(parsed.locations) && Array.isArray(parsed.operations) && Array.isArray(parsed.movements)) {
            setState({ ...(parsed as DemoState), profileName: "profileName" in parsed && typeof parsed.profileName === "string" ? parsed.profileName : initialDemoState.profileName });
          }
        }
      } catch (error) {
        console.warn("Could not restore local inventory", error);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("stocksense-inventory-v1", JSON.stringify(state));
    } catch (error) {
      console.warn("Could not save local inventory", error);
    }
  }, [state, hydrated]);

  function addProduct(product: Omit<Product, "id">, opening?: { locationId: string; quantity: number }): ActionResult {
    if (!product.name.trim() || !product.sku.trim()) return fail("Enter a product name and SKU.");
    if (!Number.isFinite(product.reorderPoint) || product.reorderPoint < 0 || (product.unitCost !== undefined && (!Number.isFinite(product.unitCost) || product.unitCost < 0))) return fail("Enter a valid reorder point and unit cost.");
    if (state.products.some((item) => item.sku.toLowerCase() === product.sku.trim().toLowerCase())) return fail("This SKU is already in use.");
    if (opening && (!state.locations.some((location) => location.id === opening.locationId) || !Number.isFinite(opening.quantity) || opening.quantity < 0)) return fail("Choose a valid opening location and quantity.");
    const id = crypto.randomUUID();
    const nextProduct = { ...product, id, sku: product.sku.trim().toUpperCase(), name: product.name.trim() };
    setState((current) => ({
      ...current,
      products: [...current.products, nextProduct],
      movements: opening && opening.quantity > 0
        ? [...current.movements, { id: crypto.randomUUID(), reference: `OPEN/${nextProduct.sku}`, type: "opening", productId: id, locationId: opening.locationId, quantity: opening.quantity, at: new Date().toISOString().slice(0, 10), actor: "Tanveer Singh" }]
        : current.movements,
    }));
    return done(`${nextProduct.name} added to the catalog.`);
  }

  function updateProduct(id: string, product: Omit<Product, "id">): ActionResult {
    const existing = state.products.find((item) => item.id === id);
    if (!existing) return fail("Product not found.");
    if (!product.name.trim() || !product.sku.trim() || !product.category.trim()) return fail("Enter a product name, SKU, and category.");
    if (state.products.some((item) => item.id !== id && item.sku.toLowerCase() === product.sku.trim().toLowerCase())) return fail("This SKU is already in use.");
    if (!Number.isFinite(product.reorderPoint) || product.reorderPoint < 0 || (product.unitCost !== undefined && (!Number.isFinite(product.unitCost) || product.unitCost < 0))) return fail("Enter a valid reorder point and unit cost.");
    if (state.movements.some((movement) => movement.productId === id) && product.unit !== existing.unit) return fail("A product with stock history must keep its unit of measure.");
    setState((current) => ({ ...current, products: current.products.map((item) => item.id === id ? { ...product, id, name: product.name.trim(), sku: product.sku.trim().toUpperCase(), category: product.category.trim() } : item) }));
    return done("Product details updated.");
  }

  function updateProfile(name: string): ActionResult {
    if (!name.trim()) return fail("Enter a display name.");
    setState((current) => ({ ...current, profileName: name.trim() }));
    return done("Profile saved in this browser.");
  }

  function addWarehouse(warehouse: Omit<Warehouse, "id">): ActionResult {
    if (!warehouse.code.trim() || !warehouse.name.trim()) return fail("Enter a warehouse code and name.");
    if (state.warehouses.some((item) => item.code.toLowerCase() === warehouse.code.trim().toLowerCase())) return fail("This warehouse code is already in use.");
    const id = crypto.randomUUID();
    setState((current) => ({
      ...current,
      warehouses: [...current.warehouses, { ...warehouse, id, code: warehouse.code.trim().toUpperCase(), name: warehouse.name.trim() }],
      locations: [...current.locations, { id: crypto.randomUUID(), warehouseId: id, code: "STOCK", name: "Main stock" }],
    }));
    return done("Warehouse and its default stock location added.");
  }

  function addLocation(location: Omit<Location, "id">): ActionResult {
    if (!location.name.trim() || !location.code.trim() || !state.warehouses.some((item) => item.id === location.warehouseId)) return fail("Enter a location name, code, and warehouse.");
    if (state.locations.some((item) => item.warehouseId === location.warehouseId && item.code.toLowerCase() === location.code.trim().toLowerCase())) return fail("This code already exists in the warehouse.");
    setState((current) => ({ ...current, locations: [...current.locations, { ...location, id: crypto.randomUUID(), code: location.code.trim().toUpperCase(), name: location.name.trim() }] }));
    return done("Location added.");
  }

  function createOperation(input: NewOperation): { result: ActionResult; id?: string } {
    const firstLine = input.lines[0];
    if (!firstLine || input.lines.some((line) => !state.products.some((product) => product.id === line.productId) || !Number.isFinite(line.quantity) || line.quantity < 0)) return { result: fail("Add a product and a valid quantity.") };
    if (input.type !== "adjustment" && input.lines.some((line) => line.quantity === 0)) return { result: fail("Line quantities must be greater than zero.") };
    if (new Set(input.lines.map((line) => line.productId)).size !== input.lines.length) return { result: fail("Add each product once per document.") };
    if (input.type === "transfer" && input.sourceLocationId === input.destinationLocationId) return { result: fail("Choose different source and destination locations.") };
    if ((input.type === "receipt" && !input.destinationLocationId) || (input.type !== "receipt" && !input.sourceLocationId)) return { result: fail("Choose the required stock location.") };
    if ((input.sourceLocationId && !state.locations.some((location) => location.id === input.sourceLocationId)) || (input.destinationLocationId && !state.locations.some((location) => location.id === input.destinationLocationId))) return { result: fail("Choose valid stock locations.") };
    if (input.type === "adjustment" && !input.reason?.trim()) return { result: fail("Enter a reason for the physical count.") };
    const id = crypto.randomUUID();
    const sourceId = input.sourceLocationId ?? input.destinationLocationId;
    const location = state.locations.find((item) => item.id === sourceId);
    const warehouse = state.warehouses.find((item) => item.id === location?.warehouseId);
    const code = { receipt: "IN", delivery: "OUT", transfer: "INT", adjustment: "ADJ" }[input.type];
    const count = state.operations.filter((item) => item.type === input.type && item.reference.startsWith(`${warehouse?.code ?? "WH"}/${code}/`)).length + 1;
    const operation: Operation = {
      ...input,
      id,
      reference: `${warehouse?.code ?? "WH"}/${code}/${String(count).padStart(4, "0")}`,
      status: "Draft",
      contact: input.contact.trim() || (input.type === "transfer" ? "Internal" : "—"),
      responsible: "Tanveer Singh",
      createdAt: new Date().toISOString().slice(0, 10),
      countBaseline: input.type === "adjustment" && input.sourceLocationId ? onHand(state, firstLine.productId, input.sourceLocationId) : undefined,
    };
    setState((current) => ({ ...current, operations: [operation, ...current.operations] }));
    return { result: done(`${operation.reference} created as a draft.`), id };
  }

  function markReady(id: string): ActionResult {
    const operation = state.operations.find((item) => item.id === id);
    if (!operation) return fail("Document not found.");
    if (operation.status === "Ready") return done("Document is already ready.");
    if (!["Draft", "Waiting"].includes(operation.status) || operation.type === "adjustment") return fail("This document cannot be marked ready.");
    if (operation.type !== "receipt") {
      const source = operation.sourceLocationId;
      if (!source) return fail("A source location is required.");
      const shortage = operation.lines.find((line) => available(state, line.productId, source) < operation.lines.filter((item) => item.productId === line.productId).reduce((sum, item) => sum + item.quantity, 0));
      if (shortage) {
        setState((current) => ({ ...current, operations: current.operations.map((item) => item.id === id ? { ...item, status: "Waiting" } : item) }));
        return fail(`Only ${available(state, shortage.productId, source)} available at the source location. Document moved to Waiting.`);
      }
    }
    setState((current) => ({ ...current, operations: current.operations.map((item) => item.id === id ? { ...item, status: "Ready" } : item) }));
    return done(`${operation.reference} is ready.`);
  }

  function markPacked(id: string): ActionResult {
    const operation = state.operations.find((item) => item.id === id);
    if (!operation || operation.type !== "delivery" || operation.status !== "Ready") return fail("Only a ready delivery can be marked picked and packed.");
    setState((current) => ({ ...current, operations: current.operations.map((item) => item.id === id ? { ...item, packed: true } : item) }));
    return done("Picking and packing confirmed.");
  }

  function complete(id: string): ActionResult {
    const operation = state.operations.find((item) => item.id === id);
    if (!operation) return fail("Document not found.");
    if (operation.status === "Done") return done("This document was already completed. Stock has not changed again.");
    if (operation.type === "adjustment" ? operation.status !== "Draft" : operation.status !== "Ready") return fail("Move this document to the required status first.");
    if (operation.type === "delivery" && !operation.packed) return fail("Confirm picking and packing before completing the delivery.");
    if (operation.type === "adjustment") {
      const line = operation.lines[0];
      const locationId = operation.sourceLocationId;
      if (!locationId || !line) return fail("Count location or product is missing.");
      const current = onHand(state, line.productId, locationId);
      if (current !== operation.countBaseline) return fail(`Stock changed from ${operation.countBaseline} to ${current}. Review the count before posting.`);
      const otherReserved = state.operations.filter((item) => item.id !== id && item.status === "Ready" && item.sourceLocationId === locationId).flatMap((item) => item.lines).filter((item) => item.productId === line.productId).reduce((sum, item) => sum + item.quantity, 0);
      if (line.quantity < otherReserved) return fail(`Count must cover ${otherReserved} reserved units.`);
    }
    const date = new Date().toISOString().slice(0, 10);
    const movements = operation.lines.flatMap((line) => {
      const entries: DemoState["movements"] = [];
      if (operation.type === "receipt" && operation.destinationLocationId) entries.push({ id: crypto.randomUUID(), reference: operation.reference, operationId: id, type: operation.type, productId: line.productId, locationId: operation.destinationLocationId, quantity: line.quantity, at: date, actor: "Tanveer Singh" });
      if ((operation.type === "delivery" || operation.type === "transfer") && operation.sourceLocationId) entries.push({ id: crypto.randomUUID(), reference: operation.reference, operationId: id, type: operation.type, productId: line.productId, locationId: operation.sourceLocationId, quantity: -line.quantity, at: date, actor: "Tanveer Singh" });
      if (operation.type === "transfer" && operation.destinationLocationId) entries.push({ id: crypto.randomUUID(), reference: operation.reference, operationId: id, type: operation.type, productId: line.productId, locationId: operation.destinationLocationId, quantity: line.quantity, at: date, actor: "Tanveer Singh" });
      if (operation.type === "adjustment" && operation.sourceLocationId) {
        const delta = line.quantity - onHand(state, line.productId, operation.sourceLocationId);
        if (delta !== 0) entries.push({ id: crypto.randomUUID(), reference: operation.reference, operationId: id, type: operation.type, productId: line.productId, locationId: operation.sourceLocationId, quantity: delta, at: date, actor: "Tanveer Singh" });
      }
      return entries;
    });
    setState((current) => ({ ...current, operations: current.operations.map((item) => item.id === id ? { ...item, status: "Done" } : item), movements: [...current.movements, ...movements] }));
    return done(`${operation.reference} completed. Stock and movement history are updated.`);
  }

  function cancel(id: string): ActionResult {
    const operation = state.operations.find((item) => item.id === id);
    if (!operation || operation.status === "Done") return fail("Completed documents cannot be canceled.");
    if (operation.status === "Canceled") return done("Document is already canceled.");
    setState((current) => ({ ...current, operations: current.operations.map((item) => item.id === id ? { ...item, status: "Canceled" } : item) }));
    return done(`${operation.reference} canceled.`);
  }

  return <DemoContext.Provider value={{ state, addProduct, updateProduct, updateProfile, addWarehouse, addLocation, createOperation, markReady, markPacked, complete, cancel }}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
