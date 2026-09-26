"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { formatDate, locationName, operationLabel, operationPath, productName } from "../../lib/inventory";
import { downloadCsv } from "../../lib/export-csv";
import type { OperationStatus, OperationType } from "../../types/inventory";
import { Drawer, EmptyState, PageHeading, SearchField, StatusBadge, primaryButton, secondaryButton, inputClass, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { OperationForm } from "./operation-form";

export function OperationsView({ type, initialStatus = "all", startNew = false, initialProductId }: { type: OperationType; initialStatus?: string; startNew?: boolean; initialProductId?: string }) {
  const { state } = useDemo();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [location, setLocation] = useState("all");
  const [view, setView] = useState<"list" | "board">("list");
  const [createOpen, setCreateOpen] = useState(startNew);
  const title = { receipt: "Receipts", delivery: "Deliveries", transfer: "Internal transfers", adjustment: "Adjustments" }[type];
  const description = { receipt: "Track incoming goods from supplier to shelf.", delivery: "Prepare and dispatch outgoing stock.", transfer: "Move quantities between stock locations.", adjustment: "Record physical counts and explain differences." }[type];
  const operations = useMemo(() => state.operations.filter((item) => {
    if (item.type !== type) return false;
    if (status === "pending" && ["Done","Canceled"].includes(item.status)) return false;
    if (status !== "all" && status !== "pending" && item.status !== status) return false;
    if (location !== "all" && item.sourceLocationId !== location && item.destinationLocationId !== location) return false;
    return `${item.reference} ${item.contact}`.toLowerCase().includes(search.toLowerCase());
  }), [state.operations, type, search, status, location]);
  const statuses: OperationStatus[] = ["Draft","Waiting","Ready","Done","Canceled"];
  return <>
    <PageHeading eyebrow="Operations" title={title} description={description} action={<div className="flex flex-wrap gap-2"><button type="button" className={secondaryButton} onClick={() => downloadCsv(`stocksense-${title.toLowerCase().replaceAll(" ", "-")}.csv`, ["Reference", "Status", "From", "To", "Contact", "Scheduled", "Products"], operations.map((item) => [item.reference, item.status, item.type === "receipt" ? item.contact : locationName(state, item.sourceLocationId), item.type === "delivery" ? item.contact : locationName(state, item.destinationLocationId), item.contact, item.scheduledAt, item.lines.map((line) => `${productName(state, line.productId)}: ${line.quantity}`).join("; ")]))}><Icon name="download" className="h-4 w-4" />Export for Excel</button><button type="button" className={primaryButton} onClick={() => setCreateOpen(true)}><Icon name="plus" className="h-4 w-4" />New {operationLabel(type).toLowerCase()}</button></div>} />
    <div className="mb-5 grid grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_150px_180px_auto]"><SearchField value={search} onChange={setSearch} placeholder="Search reference or contact" /><select className={inputClass} aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><select className={inputClass} aria-label="Filter location" value={location} onChange={(event) => setLocation(event.target.value)}><option value="all">All locations</option>{state.locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><div className="inline-flex justify-self-end rounded-md border border-border p-0.5 text-xs"><button className={`rounded px-2.5 py-1.5 transition-colors ${view==="list"?"bg-brand-soft font-semibold text-brand-strong":"text-ink-muted hover:bg-secondary"}`} type="button" aria-pressed={view==="list"} onClick={() => setView("list")}>List</button><button className={`rounded px-2.5 py-1.5 transition-colors ${view==="board"?"bg-brand-soft font-semibold text-brand-strong":"text-ink-muted hover:bg-secondary"}`} type="button" aria-pressed={view==="board"} onClick={() => setView("board")}>Board</button></div></div>
    {view === "list" ? <div className="overflow-x-auto rounded-lg border border-border">{operations.length ? <table className={tableClass}><thead><tr><th className={thClass}>Reference</th><th className={thClass}>From</th><th className={thClass}>To</th><th className={thClass}>Contact</th><th className={thClass}>Scheduled</th><th className={thClass}>Status</th></tr></thead><tbody>{operations.map((item) => <tr className="hover:bg-brand-soft/40" key={item.id}><td className={tdClass}><Link className="font-mono text-xs font-semibold text-brand-strong hover:underline" href={operationPath(item)}>{item.reference}</Link><span className="block pt-0.5 text-[11px] text-ink-muted">{item.lines.map((line)=>productName(state,line.productId)).join(", ")}</span></td><td className={tdClass}>{item.type==="receipt"?item.contact:locationName(state,item.sourceLocationId)}</td><td className={tdClass}>{item.type==="delivery"?item.contact:locationName(state,item.destinationLocationId)}</td><td className={tdClass}>{item.contact}</td><td className={tdClass}>{formatDate(item.scheduledAt)}</td><td className={tdClass}><StatusBadge status={item.status} /></td></tr>)}</tbody></table> : <EmptyState title="No matching documents" description="Try another reference, status, or location." />}</div> : <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">{statuses.map((column) => <section key={column} className="rounded-lg border border-border bg-secondary p-2"><div className="flex items-center justify-between px-2 py-2"><h2 className="text-xs font-semibold">{column}</h2><span className="font-mono text-[11px] text-ink-muted">{operations.filter((item)=>item.status===column).length}</span></div><div className="space-y-2">{operations.filter((item)=>item.status===column).map((item)=><Link key={item.id} href={operationPath(item)} className="block rounded-md border border-border bg-white p-3 hover:border-brand-strong"><span className="font-mono text-[11px] font-semibold text-brand-strong">{item.reference}</span><span className="mt-2 block text-xs font-medium">{item.contact}</span><span className="mt-1 block text-[11px] text-ink-muted">{formatDate(item.scheduledAt)}</span></Link>)}</div></section>)}</div>}
    <p className="mt-4 text-xs text-ink-muted">{operations.length} {operations.length === 1 ? "document" : "documents"}</p>
    {createOpen && <Drawer title={`New ${operationLabel(type).toLowerCase()}`} description="Create a new document draft." onClose={() => setCreateOpen(false)}><OperationForm type={type} initialProductId={initialProductId} onClose={() => setCreateOpen(false)} /></Drawer>}
  </>;
}
