"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { formatQuantity, totalAvailable, totalOnHand } from "../../lib/inventory";
import { downloadCsv } from "../../lib/export-csv";
import { Drawer, EmptyState, PageHeading, SearchField, StatusBadge, primaryButton, secondaryButton, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SelectField } from "../ui/select-field";
import { ProductForm } from "./product-form";

export function ProductsView({ initialStockFilter = "all" }: { initialStockFilter?: "all" | "low" }) {
  const { state } = useDemo();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stock, setStock] = useState(initialStockFilter);
  const [addOpen, setAddOpen] = useState(false);
  const categories = [...new Set(state.products.map((item) => item.category))];
  const products = useMemo(() => state.products.filter((product) => {
    const matchesSearch = `${product.name} ${product.sku}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    const matchesStock = stock === "all" || totalOnHand(state,product.id) <= product.reorderPoint;
    return matchesSearch && matchesCategory && matchesStock;
  }), [state, search, category, stock]);
  return <>
    <PageHeading eyebrow="Catalog" title="Products & stock" description="Search the catalog and inspect current availability by location." action={<div className="flex flex-wrap gap-2"><button className={secondaryButton} type="button" onClick={() => downloadCsv("stocksense-products.csv", ["SKU", "Product", "Category", "Unit", "Unit cost", "On hand", "Reserved", "Free to use", "Reorder point"], products.map((product) => { const onHand = totalOnHand(state, product.id); const free = totalAvailable(state, product.id); return [product.sku, product.name, product.category, product.unit, product.unitCost ?? "", onHand, onHand - free, free, product.reorderPoint]; }))}><Icon name="download" className="h-4 w-4" />Export for Excel</button><button className={primaryButton} type="button" onClick={() => setAddOpen(true)}><Icon name="plus" className="h-4 w-4" />Add product</button></div>} />
    <div className="mb-7 grid grid-cols-1 items-center gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(280px,1fr)_220px_170px]"><SearchField value={search} onChange={setSearch} placeholder="Search name or SKU" /><SelectField label="Filter by category" value={category} onChange={setCategory} options={[{ value: "all", label: "All categories" }, ...categories.map((item) => ({ value: item, label: item }))]} /><SelectField label="Filter by stock" value={stock} onChange={(value) => setStock(value as "all" | "low")} options={[{ value: "all", label: "All stock" }, { value: "low", label: "Low / out" }]} /></div>
    <div className="mb-3 flex items-baseline gap-2"><h2 className="text-sm font-semibold">Products</h2><span className="font-mono text-xs text-ink-muted">{products.length}</span></div>
    <div className="overflow-x-auto rounded-lg border border-border">{products.length ? <table className={tableClass}><thead><tr><th className={thClass}>Product</th><th className={thClass}>Category</th><th className={thClass}>Unit</th><th className={`${thClass} text-right`}>On hand</th><th className={`${thClass} text-right`}>Free to use</th><th className={thClass}>Status</th></tr></thead><tbody>{products.map((product) => { const total = totalOnHand(state,product.id); const free = totalAvailable(state,product.id); const status = total === 0 ? "Out" : total <= product.reorderPoint ? "Low" : null; return <tr className="transition-colors hover:bg-brand-soft/40" key={product.id}><td className={tdClass}><Link className="font-medium text-brand-strong hover:underline" href={`/products/${product.id}`}>{product.name}</Link><span className="block font-mono text-[11px] text-ink-muted">{product.sku}</span></td><td className={tdClass}>{product.category}</td><td className={tdClass}>{product.unit}</td><td className={`${tdClass} text-right font-mono`}>{formatQuantity(total)}</td><td className={`${tdClass} text-right font-mono`}>{formatQuantity(free)}</td><td className={tdClass}>{status ? <StatusBadge status={status} /> : <span className="text-xs text-ok-ink">In stock</span>}</td></tr>; })}</tbody></table> : <EmptyState title="No products match" description="Try a different search or clear the filters." action={<button className="text-sm font-medium text-brand-strong hover:underline" onClick={() => {setSearch("");setCategory("all");setStock("all");}}>Clear filters</button>} />}</div>
    {addOpen && <Drawer title="Add product" description="Create a catalog item and optional opening balance." onClose={() => setAddOpen(false)}><ProductForm onClose={() => setAddOpen(false)} /></Drawer>}
  </>;
}
