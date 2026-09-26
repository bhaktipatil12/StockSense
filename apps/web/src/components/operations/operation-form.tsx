"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "../../context/demo-context";
import { onHand, operationPath } from "../../lib/inventory";
import type { OperationLine, OperationType } from "../../types/inventory";
import { inputClass, labelClass, primaryButton, secondaryButton } from "../ui/primitives";

export function OperationForm({ type, onClose, initialProductId }: { type: OperationType; onClose: () => void; initialProductId?: string }) {
  const router = useRouter();
  const { state, createOperation } = useDemo();
  const [contact, setContact] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState(state.locations[0]?.id ?? "");
  const [destinationLocationId, setDestinationLocationId] = useState(state.locations[type === "transfer" ? 1 : 0]?.id ?? "");
  const [scheduledAt, setScheduledAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<OperationLine[]>([{ productId: state.products.some((product) => product.id === initialProductId) ? initialProductId ?? "" : state.products[0]?.id ?? "", quantity: 1 }]);
  const [message, setMessage] = useState("");
  const isAdjustment = type === "adjustment";
  const previewLine = lines[0];
  function updateLine(index: number, value: Partial<OperationLine>) {
    setLines((current) => current.map((line, position) => position === index ? { ...line, ...value } : line));
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { result, id } = createOperation({ type, contact, sourceLocationId: type === "receipt" ? undefined : sourceLocationId, destinationLocationId: type === "receipt" || type === "transfer" ? destinationLocationId : undefined, scheduledAt, lines, reason });
    if (result.ok && id) {
      onClose();
      router.push(operationPath({ id, type }));
    } else setMessage(result.message);
  }
  const contactLabel = { receipt: "Supplier", delivery: "Customer", transfer: "Transfer note", adjustment: "Count label" }[type];
  return <form className="space-y-5" onSubmit={submit}>
    <label className={labelClass}>{contactLabel}<input className={inputClass} value={contact} onChange={(event) => setContact(event.target.value)} placeholder={type === "transfer" ? "Internal movement" : `Enter ${contactLabel.toLowerCase()}`} required={type === "receipt" || type === "delivery"} /></label>
    {type !== "receipt" && <label className={labelClass}>{isAdjustment ? "Count location" : "Source location"}<select className={inputClass} value={sourceLocationId} onChange={(event) => setSourceLocationId(event.target.value)}>{state.locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>}
    {(type === "receipt" || type === "transfer") && <label className={labelClass}>Destination location<select className={inputClass} value={destinationLocationId} onChange={(event) => setDestinationLocationId(event.target.value)}>{state.locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>}
    <label className={labelClass}>Scheduled date<input className={inputClass} type="date" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} required /></label>
    <div className="border-t border-border pt-5"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">{isAdjustment ? "Physical count" : "Products"}</h3>{!isAdjustment && <button className="text-xs font-semibold text-brand-strong hover:underline" type="button" onClick={() => setLines((current) => [...current, { productId: state.products.find((product) => !current.some((line) => line.productId === product.id))?.id ?? "", quantity: 1 }])} disabled={lines.length >= state.products.length}>Add line</button>}</div><div className="space-y-3">{lines.map((line,index) => <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[minmax(0,1fr)_110px_auto]" key={index}><label className={labelClass}>Product<select className={inputClass} value={line.productId} onChange={(event) => updateLine(index,{ productId:event.target.value })}>{state.products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label><label className={labelClass}>{isAdjustment ? "Counted" : "Quantity"}<input className={inputClass} type="number" min={isAdjustment ? "0" : ".001"} step=".001" value={line.quantity} onChange={(event) => updateLine(index,{ quantity:Number(event.target.value) })} required /></label>{!isAdjustment && <button className="mb-1 rounded-md p-2 text-xs text-ink-muted hover:bg-bad-wash hover:text-bad-ink disabled:opacity-40" type="button" aria-label={`Remove line ${index+1}`} disabled={lines.length===1} onClick={() => setLines((current) => current.filter((_,position) => position !== index))}>Remove</button>}</div>)}</div>{isAdjustment && previewLine && <p className="mt-2 text-xs text-ink-muted">Recorded: {onHand(state,previewLine.productId,sourceLocationId)} {state.products.find((item)=>item.id===previewLine.productId)?.unit}. Difference: {(previewLine.quantity-onHand(state,previewLine.productId,sourceLocationId)).toFixed(3)}.</p>}</div>
    {isAdjustment && <label className={labelClass}>Reason<textarea className={`${inputClass} min-h-24`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is the counted quantity different?" required /></label>}
    {message && <p role="alert" className="rounded-md bg-bad-wash p-3 text-sm text-bad-ink">{message}</p>}
    <div className="flex justify-end gap-2 pt-3"><button type="button" className={secondaryButton} onClick={onClose}>Cancel</button><button className={primaryButton} type="submit">Create draft</button></div>
  </form>;
}
