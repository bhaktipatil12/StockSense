"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { formatDate, formatQuantity, locationName, operationLabel, operationPath, productName } from "../../lib/inventory";
import { downloadCsv } from "../../lib/export-csv";
import type { OperationType } from "../../types/inventory";
import { EmptyState, PageHeading, SearchField, secondaryButton, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SelectField } from "../ui/select-field";

export function MoveHistoryView() {
  const { state } = useDemo();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("all");
  const rows = useMemo(() => [...state.movements].reverse().filter((movement) => {
    const operation = state.operations.find((item) => item.id === movement.operationId);
    const product = state.products.find((item) => item.id === movement.productId);
    const matchesSearch = `${movement.reference} ${operation?.reference ?? ""} ${product?.sku ?? ""} ${product?.name ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (type === "all" || movement.type === type) && (location === "all" || movement.locationId === location);
  }), [state, search, type, location]);
  return <>
    <PageHeading eyebrow="Audit trail" title="Move history" description="A read-only record of posted stock changes and their document references." action={<button className={secondaryButton} type="button" onClick={() => downloadCsv("stocksense-move-history.csv", ["Posted", "Reference", "SKU", "Product", "Location", "Type", "Change", "Unit", "Actor"], rows.map((movement) => { const product = state.products.find((item) => item.id === movement.productId); return [movement.at, movement.reference, product?.sku ?? "", product?.name ?? "", locationName(state, movement.locationId), movement.type, movement.quantity, product?.unit ?? "", movement.actor]; }))}><Icon name="download" className="h-4 w-4" />Export for Excel</button>} />
    <div className="mb-5 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_200px]"><SearchField value={search} onChange={setSearch} placeholder="Search SKU, product, or reference" /><SelectField label="Filter movement type" value={type} onChange={setType} options={[{ value: "all", label: "All types" }, ...["opening", "receipt", "delivery", "transfer", "adjustment"].map((item) => ({ value: item, label: item === "opening" ? "Opening stock" : operationLabel(item as OperationType) }))]} /><SelectField label="Filter location" value={location} onChange={setLocation} options={[{ value: "all", label: "All locations" }, ...state.locations.map((item) => ({ value: item.id, label: item.name }))]} /></div>
    <div className="mb-3 flex items-baseline gap-2"><h2 className="text-sm font-semibold">Movements</h2><span className="font-mono text-xs text-ink-muted">{rows.length}</span></div>
    <div className="overflow-x-auto rounded-lg border border-border">{rows.length ? <table className={tableClass}><thead><tr><th className={thClass}>Posted</th><th className={thClass}>Reference</th><th className={thClass}>Product</th><th className={thClass}>Location</th><th className={thClass}>Type</th><th className={`${thClass} text-right`}>Change</th></tr></thead><tbody>{rows.map((movement) => { const operation = state.operations.find((item) => item.id === movement.operationId); const product = state.products.find((item) => item.id === movement.productId); return <tr className="hover:bg-brand-soft/40" key={movement.id}><td className={tdClass}>{formatDate(movement.at)}</td><td className={tdClass}>{operation ? <Link className="font-mono text-xs font-semibold text-brand-strong hover:underline" href={operationPath(operation)}>{operation.reference}</Link> : <span className="font-mono text-xs">{movement.reference}</span>}</td><td className={tdClass}><span className="font-medium">{productName(state,movement.productId)}</span><span className="block font-mono text-[11px] text-ink-muted">{product?.sku}</span></td><td className={tdClass}>{locationName(state,movement.locationId)}</td><td className={tdClass}>{movement.type === "opening" ? "Opening stock" : operationLabel(movement.type)}</td><td className={`${tdClass} text-right font-mono font-semibold ${movement.quantity > 0 ? "text-ok-ink" : "text-bad-ink"}`}>{movement.quantity > 0 ? "+" : ""}{formatQuantity(movement.quantity)} {product?.unit}</td></tr>; })}</tbody></table> : <EmptyState title="No movements match" description="Clear the filters to see all stock movements." />}</div>
    <p className="mt-4 text-xs text-ink-muted">Each transfer creates a negative source entry and a positive destination entry.</p>
  </>;
}
