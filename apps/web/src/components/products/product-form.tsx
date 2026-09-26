"use client";

import { useState, type FormEvent } from "react";
import { useDemo } from "../../context/demo-context";
import type { Product, Unit } from "../../types/inventory";
import { inputClass, labelClass, primaryButton, secondaryButton } from "../ui/primitives";

export function ProductForm({ onClose, product }: { onClose: () => void; product?: Product }) {
  const { state, addProduct, updateProduct } = useDemo();
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState(product?.category ?? "Furniture");
  const [unit, setUnit] = useState<Unit>(product?.unit ?? "pcs");
  const [reorderPoint, setReorderPoint] = useState(String(product?.reorderPoint ?? 10));
  const [unitCost, setUnitCost] = useState(product?.unitCost === undefined ? "" : String(product.unitCost));
  const [opening, setOpening] = useState("0");
  const [locationId, setLocationId] = useState(state.locations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const details = { name, sku, category, unit, reorderPoint: Number(reorderPoint), unitCost: unitCost ? Number(unitCost) : undefined };
    const result = product ? updateProduct(product.id, details) : addProduct(details, { locationId, quantity: Number(opening) });
    if (result.ok) onClose(); else setMessage(result.message);
  }
  return <form className="space-y-5" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Product name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Steel rod" required /></label><label className={labelClass}>SKU / code<input className={inputClass} value={sku} onChange={(event) => setSku(event.target.value)} placeholder="e.g. ROD-01" required /></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Category<select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>{[...new Set([category,"Furniture","Raw materials","Components","Finished goods"])].map((item) => <option key={item}>{item}</option>)}</select></label><label className={labelClass}>Unit of measure<select className={inputClass} value={unit} onChange={(event) => setUnit(event.target.value as Unit)} disabled={Boolean(product && state.movements.some((movement) => movement.productId === product.id))}>{["pcs","kg","m","box"].map((item) => <option key={item}>{item}</option>)}</select></label></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Reorder at<input className={inputClass} type="number" min="0" step=".001" value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} required /></label><label className={labelClass}>Unit cost (optional)<input className={inputClass} type="number" min="0" step=".01" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="₹ 0.00" /></label></div>
    {!product && <div className="border-t border-border pt-5"><p className="mb-3 text-sm font-semibold">Opening stock <span className="font-normal text-ink-muted">(optional)</span></p><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Quantity<input className={inputClass} type="number" min="0" step=".001" value={opening} onChange={(event) => setOpening(event.target.value)} /></label><label className={labelClass}>Location<select className={inputClass} value={locationId} onChange={(event) => setLocationId(event.target.value)}>{state.locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label></div><p className="mt-2 text-xs text-ink-muted">Opening stock creates a movement in move history.</p></div>}
    {message && <p role="alert" className="rounded-md bg-bad-wash px-3 py-2 text-sm text-bad-ink">{message}</p>}
    <div className="flex justify-end gap-2 pt-3"><button className={secondaryButton} type="button" onClick={onClose}>Cancel</button><button className={primaryButton} type="submit">{product ? "Save changes" : "Add product"}</button></div>
  </form>;
}
