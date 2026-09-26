"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { formatDate, formatQuantity, locationName, onHand, operationLabel, operationPath, productName } from "../../lib/inventory";
import { PageHeading, StatusBadge, primaryButton, inputClass, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";

export function DashboardView() {
  const { state } = useDemo();
  const [documentType, setDocumentType] = useState("all");
  const [status, setStatus] = useState("all");
  const [warehouseId, setWarehouseId] = useState("all");
  const [category, setCategory] = useState("all");
  const locations = warehouseId === "all" ? state.locations : state.locations.filter((location) => location.warehouseId === warehouseId);
  const stock = (productId: string) => locations.reduce((sum, location) => sum + onHand(state, productId, location.id), 0);
  const scopedProducts = state.products.filter((product) => category === "all" || product.category === category);
  const scopedOperations = state.operations.filter((operation) => {
    if (documentType !== "all" && operation.type !== documentType) return false;
    if (status !== "all" && operation.status !== status) return false;
    if (warehouseId !== "all" && !locations.some((location) => location.id === operation.sourceLocationId || location.id === operation.destinationLocationId)) return false;
    return category === "all" || operation.lines.some((line) => scopedProducts.some((product) => product.id === line.productId));
  });
  const pending = scopedOperations.filter((item) => !["Done", "Canceled"].includes(item.status));
  const low = scopedProducts.filter((product) => stock(product.id) <= product.reorderPoint);
  const today = new Date().toISOString().slice(0, 10);
  const attention = pending.filter((item) => item.status === "Waiting" || item.scheduledAt < today).slice(0, 4);
  const recent = [...state.movements].reverse().filter((movement) => {
    if (!locations.some((location) => location.id === movement.locationId)) return false;
    if (!scopedProducts.some((product) => product.id === movement.productId)) return false;
    if (documentType !== "all" && movement.type !== documentType) return false;
    const operation = state.operations.find((item) => item.id === movement.operationId);
    return status === "all" || operation?.status === status;
  }).slice(0, 5);
  const metrics = [
    { label: "Products in stock", value: scopedProducts.filter((product) => stock(product.id) > 0).length, href: "/products" },
    { label: "Low / out of stock", value: low.length, href: "/products?stock=low" },
    { label: "Pending receipts", value: pending.filter((item) => item.type === "receipt").length, href: "/operations/receipts?status=pending" },
    { label: "Pending deliveries", value: pending.filter((item) => item.type === "delivery").length, href: "/operations/deliveries?status=pending" },
    { label: "Scheduled transfers", value: pending.filter((item) => item.type === "transfer").length, href: "/operations/transfers?status=pending" },
  ];
  return <>
    <PageHeading eyebrow="Inventory overview" title="Inventory workspace" description="A clear view of what is available and what needs to move next." action={<Link className={primaryButton} href="/operations/receipts?new=1"><Icon name="plus" className="h-4 w-4" />New receipt</Link>} />
    <div className="mb-5 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Dashboard filters"><select className={inputClass} aria-label="Document type" value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="all">All documents</option><option value="receipt">Receipts</option><option value="delivery">Deliveries</option><option value="transfer">Internal transfers</option><option value="adjustment">Adjustments</option></select><select className={inputClass} aria-label="Document status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{["Draft", "Waiting", "Ready", "Done", "Canceled"].map((value) => <option key={value}>{value}</option>)}</select><select className={inputClass} aria-label="Warehouse" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}><option value="all">All warehouses</option>{state.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select><select className={inputClass} aria-label="Product category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{[...new Set(state.products.map((product) => product.category))].map((value) => <option key={value}>{value}</option>)}</select></div>
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Inventory metrics">{metrics.map((metric) => <Link key={metric.label} href={metric.href} className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-brand-strong hover:bg-brand-soft"><span className="block text-xs font-medium text-ink-muted">{metric.label}</span><span className="mt-3 block font-mono text-3xl font-medium leading-none text-foreground">{metric.value}</span></Link>)}</div>
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.85fr)]">
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Needs attention</h2><span className="text-xs text-ink-muted">{attention.length} open items</span></div>
        <div className="overflow-hidden rounded-lg border border-border">{attention.length ? attention.map((item) => <Link href={operationPath(item)} key={item.id} className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-3.5 transition-colors last:border-b-0 hover:bg-brand-soft"><span><span className="block text-sm font-semibold text-foreground">{item.reference} · {operationLabel(item.type)}</span><span className="block pt-0.5 text-xs text-ink-muted">{item.contact} · Scheduled {formatDate(item.scheduledAt)}</span></span><StatusBadge status={item.status} /></Link>) : <div className="p-10 text-center text-sm text-ink-muted">No waiting or overdue operations.</div>}</div>
        <div className="mb-3 mt-8 flex items-center justify-between"><h2 className="text-base font-semibold">Recent movements</h2><Link className="text-xs font-semibold text-brand-strong hover:underline" href="/moves">View history</Link></div>
        <div className="overflow-x-auto rounded-lg border border-border"><table className={tableClass}><thead><tr><th className={thClass}>Product</th><th className={thClass}>Reference</th><th className={thClass}>Location</th><th className={`${thClass} text-right`}>Change</th></tr></thead><tbody>{recent.map((movement) => { const product = state.products.find((item) => item.id === movement.productId); const reference = state.operations.find((item) => item.id === movement.operationId)?.reference ?? movement.reference; return <tr className="hover:bg-brand-soft/40" key={movement.id}><td className={tdClass}><span className="block font-medium">{productName(state,movement.productId)}</span><span className="font-mono text-[11px] text-ink-subtle">{product?.sku}</span></td><td className={`${tdClass} font-mono text-xs`}>{reference}</td><td className={tdClass}>{locationName(state,movement.locationId)}</td><td className={`${tdClass} text-right font-mono font-medium ${movement.quantity > 0 ? "text-ok-ink" : "text-bad-ink"}`}>{movement.quantity > 0 ? "+" : ""}{formatQuantity(movement.quantity)} {product?.unit}</td></tr>; })}</tbody></table></div>
      </div>
      <aside className="min-w-0"><div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Stock watch</h2><Link className="text-xs font-semibold text-brand-strong hover:underline" href="/products?stock=low">All products</Link></div><div className="overflow-hidden rounded-lg border border-border">{low.length ? low.map((product) => <Link href={`/products/${product.id}`} key={product.id} className="flex items-center justify-between gap-4 border-b border-border-subtle px-4 py-3.5 last:border-b-0 hover:bg-brand-soft/40"><span><span className="block text-sm font-medium">{product.name}</span><span className="block font-mono text-[11px] text-ink-muted">{product.sku}</span></span><span className="whitespace-nowrap font-mono text-xs text-warn-ink">{formatQuantity(stock(product.id))} {product.unit}</span></Link>) : <p className="p-5 text-xs text-ink-muted">No low stock items in this selection.</p>}</div><div className="mt-5 rounded-lg border border-border bg-secondary p-5"><p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">Traceable by design</p><h3 className="mt-2 font-serif text-xl text-foreground">Every quantity has a story.</h3><p className="mt-2 text-xs leading-5 text-ink-muted">See the document and location behind each posted stock movement.</p><Link className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong hover:underline" href="/moves">Open move history <Icon name="arrow" className="h-3 w-3" /></Link></div></aside>
    </div>
  </>;
}
