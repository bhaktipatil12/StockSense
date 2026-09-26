"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { Drawer, EmptyState, PageHeading, inputClass, labelClass, primaryButton, secondaryButton, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SelectField } from "../ui/select-field";

export function SettingsView({ section }: { section: "warehouses" | "locations" }) {
  const { state, addWarehouse, addLocation } = useDemo();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [warehouseId, setWarehouseId] = useState(state.warehouses[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const isWarehouses = section === "warehouses";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = isWarehouses ? addWarehouse({ code, name, address }) : addLocation({ code, name, warehouseId });
    if (result.ok) { setOpen(false); setCode(""); setName(""); setAddress(""); setMessage(""); } else setMessage(result.message);
  }
  return <>
    <PageHeading eyebrow="Settings" title={isWarehouses ? "Warehouses" : "Locations"} description={isWarehouses ? "Manage physical sites and their default stock locations." : "Organize the racks, rooms, and storage areas that hold stock."} action={<button className={primaryButton} type="button" onClick={() => setOpen(true)}><Icon name="plus" className="h-4 w-4" />Add {isWarehouses ? "warehouse" : "location"}</button>} />
    <nav className="mb-6 flex gap-2 border-b border-border" aria-label="Settings sections"><Link href="/settings/warehouses" className={`border-b-2 px-3 py-2 text-sm ${isWarehouses ? "border-brand-strong font-semibold text-brand-strong" : "border-transparent text-ink-muted hover:text-brand-strong"}`}>Warehouses</Link><Link href="/settings/locations" className={`border-b-2 px-3 py-2 text-sm ${!isWarehouses ? "border-brand-strong font-semibold text-brand-strong" : "border-transparent text-ink-muted hover:text-brand-strong"}`}>Locations</Link></nav>
    {isWarehouses ? <div className="grid gap-3 lg:grid-cols-2">{state.warehouses.map((warehouse) => <div key={warehouse.id} className="rounded-lg border border-border p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className="font-mono text-[11px] text-ink-muted">{warehouse.code}</span><h2 className="mt-1 text-lg font-semibold tracking-tight">{warehouse.name}</h2><p className="mt-1 text-sm text-ink-muted">{warehouse.address || "No address added"}</p></div><span className="rounded-md bg-ok-wash px-2 py-1 text-xs font-medium text-ok-ink">Active</span></div><div className="mt-5 border-t border-border pt-4"><p className="mb-2 text-xs font-semibold text-ink-muted">Locations</p><div className="flex flex-wrap gap-2">{state.locations.filter((item)=>item.warehouseId===warehouse.id).map((location) => <span className="rounded-md bg-secondary px-2 py-1 font-mono text-[11px]" key={location.id}>{location.code} · {location.name}</span>)}</div></div></div>)}</div> : state.locations.length ? <><div className="space-y-2 sm:hidden">{state.locations.map((location) => <div key={location.id} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold">{location.name}</h2><span className="font-mono text-[11px] text-ink-muted">{location.code}</span></div><p className="mt-2 text-xs text-ink-muted">{state.warehouses.find((item) => item.id === location.warehouseId)?.name}</p></div>)}</div><div className="hidden overflow-x-auto rounded-lg border border-border sm:block"><table className={tableClass}><thead><tr><th className={thClass}>Location</th><th className={thClass}>Short code</th><th className={thClass}>Warehouse</th><th className={thClass}>Description</th></tr></thead><tbody>{state.locations.map((location)=><tr key={location.id}><td className={`${tdClass} font-medium`}>{location.name}</td><td className={`${tdClass} font-mono text-xs`}>{location.code}</td><td className={tdClass}>{state.warehouses.find((item)=>item.id===location.warehouseId)?.name}</td><td className={`${tdClass} text-ink-muted`}>Stock holding location</td></tr>)}</tbody></table></div></> : <div className="rounded-lg border border-border"><EmptyState title="No locations" description="Add a warehouse to create its default stock location." /></div>}
    {open && <Drawer title={`Add ${isWarehouses ? "warehouse" : "location"}`} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-5"><label className={labelClass}>Name<input className={inputClass} value={name} onChange={(event)=>setName(event.target.value)} placeholder={isWarehouses ? "e.g. Main warehouse" : "e.g. Production rack"} required /></label><label className={labelClass}>Short code<input className={inputClass} value={code} onChange={(event)=>setCode(event.target.value)} placeholder={isWarehouses ? "e.g. WH" : "e.g. PROD"} required /></label>{isWarehouses ? <label className={labelClass}>Address<input className={inputClass} value={address} onChange={(event)=>setAddress(event.target.value)} placeholder="City, region" /></label> : <div className={labelClass}><span>Warehouse</span><SelectField label="Warehouse" value={warehouseId} onChange={setWarehouseId} options={state.warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name }))} /></div>}{message && <p role="alert" className="rounded-md bg-bad-wash p-3 text-sm text-bad-ink">{message}</p>}<div className="flex justify-end gap-2 pt-3"><button className={secondaryButton} type="button" onClick={()=>setOpen(false)}>Cancel</button><button className={primaryButton} type="submit">Add {isWarehouses ? "warehouse" : "location"}</button></div></form></Drawer>}
  </>;
}
