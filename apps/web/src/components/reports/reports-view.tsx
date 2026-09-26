"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemo } from "../../context/demo-context";
import { downloadCsv } from "../../lib/export-csv";
import { formatQuantity, totalOnHand } from "../../lib/inventory";
import type { Product } from "../../types/inventory";
import { EmptyState, PageHeading, secondaryButton, tableClass, tdClass, thClass } from "../ui/primitives";
import { Icon } from "../ui/icon";

interface ValuationRow {
  category: string;
  products: (Product & { quantity: number; value: number })[];
  value: number;
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ReportsView() {
  const { state } = useDemo();
  const [expanded, setExpanded] = useState<string[]>([]);
  const rows: ValuationRow[] = state.categories.map((category) => {
    const products = state.products.filter((product) => product.category === category.name).map((product) => {
      const quantity = totalOnHand(state, product.id);
      return { ...product, quantity, value: quantity * (product.unitCost ?? 0) };
    });
    return { category: category.name, products, value: products.reduce((sum, product) => sum + product.value, 0) };
  });
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(1, ...rows.map((row) => row.value));
  const unpriced = state.products.filter((product) => product.unitCost === undefined && totalOnHand(state, product.id) > 0).length;

  function toggle(category: string) {
    setExpanded((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  function exportReport() {
    downloadCsv("stocksense-inventory-valuation.csv", ["Category", "SKU", "Product", "On hand", "Unit", "Unit cost (INR)", "Value (INR)"], rows.flatMap((row) => row.products.map((product) => [row.category, product.sku, product.name, product.quantity, product.unit, product.unitCost ?? "", product.value])));
  }

  return <>
    <PageHeading eyebrow="Reports" title="Inventory valuation" description="Current on-hand stock valued at each product's unit cost." action={<button className={secondaryButton} type="button" onClick={exportReport}><Icon name="download" className="h-4 w-4" />Export for Excel</button>} />
    <div className="mb-7 grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-border p-5"><p className="text-xs text-ink-muted">Total stock value</p><p className="mt-2 font-mono text-2xl font-medium tracking-tight">{money.format(total)}</p></div>
      <div className="rounded-lg border border-border p-5"><p className="text-xs text-ink-muted">Categories</p><p className="mt-2 font-mono text-2xl font-medium">{state.categories.length}</p></div>
      <div className="rounded-lg border border-border p-5"><p className="text-xs text-ink-muted">Catalog products</p><p className="mt-2 font-mono text-2xl font-medium">{state.products.length}</p></div>
    </div>
    {unpriced > 0 && <p className="mb-6 rounded-md bg-warn-wash px-4 py-3 text-sm text-warn-ink">{unpriced} stocked {unpriced === 1 ? "product has" : "products have"} no unit cost. Its value is excluded until a cost is added.</p>}
    <section className="mb-7 rounded-lg border border-border p-5 sm:p-6" aria-labelledby="value-by-category"><h2 id="value-by-category" className="mb-5 text-sm font-semibold">Stock value by category</h2>{rows.length ? <div className="space-y-4">{rows.map((row) => <div className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)_115px] sm:items-center" key={row.category}><Link href={`/products?category=${encodeURIComponent(row.category)}`} className="truncate text-sm font-medium text-brand-strong hover:underline">{row.category}</Link><div className="h-2 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${row.category}: ${money.format(row.value)}`}><div className="h-full rounded-full bg-brand-strong" style={{ width: `${row.value ? Math.max(2, row.value / max * 100) : 0}%` }} /></div><span className="font-mono text-xs font-medium sm:text-right">{money.format(row.value)}</span></div>)}</div> : <EmptyState title="No categories yet" description="Add a category and products to see their stock value." />}</section>
    <section className="min-w-0"><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-sm font-semibold">Category breakdown</h2><span className="text-xs text-ink-muted">Select a category to see products</span></div>
      <div className="space-y-2 sm:hidden">{rows.map((row) => <div key={row.category} className="rounded-lg border border-border"><button type="button" aria-expanded={expanded.includes(row.category)} onClick={() => toggle(row.category)} className="flex w-full items-center justify-between gap-3 p-4 text-left"><span className="flex min-w-0 items-center gap-2"><Icon name="chevron" className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${expanded.includes(row.category) ? "rotate-90" : ""}`} /><span className="truncate text-sm font-medium">{row.category}</span></span><span className="shrink-0 font-mono text-xs">{money.format(row.value)}</span></button><p className="px-4 pb-3 text-xs text-ink-muted">{row.products.length} products · {total ? formatQuantity(row.value / total * 100) : "0"}% of value</p>{expanded.includes(row.category) && <div className="border-t border-border-subtle">{row.products.length ? row.products.map((product) => <Link href={`/products/${product.id}`} key={product.id} className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3 text-xs last:border-0 hover:bg-brand-soft/50"><span className="min-w-0 truncate text-brand-strong">{product.name}</span><span className="shrink-0 font-mono">{money.format(product.value)}</span></Link>) : <p className="px-4 py-3 text-xs text-ink-muted">No products in this category.</p>}</div>}</div>)}</div>
      <div className="hidden overflow-x-auto rounded-lg border border-border sm:block"><table className={`${tableClass} min-w-[520px]`}><thead><tr><th className={thClass}>Category</th><th className={`${thClass} text-right`}>Products</th><th className={`${thClass} text-right`}>Share</th><th className={`${thClass} text-right`}>Stock value</th></tr></thead><tbody>{rows.map((row) => <tr key={row.category} className="border-b border-border-subtle"><td colSpan={4} className="p-0"><button type="button" aria-expanded={expanded.includes(row.category)} onClick={() => toggle(row.category)} className="grid w-full grid-cols-[minmax(0,1fr)_90px_75px_120px] items-center gap-2 px-4 py-3 text-left text-sm hover:bg-brand-soft/50"><span className="flex min-w-0 items-center gap-2 font-medium"><Icon name="chevron" className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${expanded.includes(row.category) ? "rotate-90" : ""}`} /><span className="truncate">{row.category}</span></span><span className="text-right font-mono text-xs">{row.products.length}</span><span className="text-right font-mono text-xs text-ink-muted">{total ? formatQuantity(row.value / total * 100) : "0"}%</span><span className="text-right font-mono text-xs font-medium">{money.format(row.value)}</span></button>{expanded.includes(row.category) && <div className="border-t border-border-subtle bg-secondary/50">{row.products.length ? row.products.map((product) => <Link href={`/products/${product.id}`} key={product.id} className="grid grid-cols-[minmax(0,1fr)_145px_115px] items-center gap-3 border-b border-border-subtle px-5 py-3 text-xs last:border-0 hover:bg-brand-soft/50"><span className="min-w-0 truncate text-brand-strong">{product.name} <span className="font-mono text-ink-muted">{product.sku}</span></span><span className="text-right font-mono text-ink-muted">{formatQuantity(product.quantity)} {product.unit} × {money.format(product.unitCost ?? 0)}</span><span className="text-right font-mono">{money.format(product.value)}</span></Link>) : <p className="px-5 py-3 text-xs text-ink-muted">No products in this category.</p>}</div>}</td></tr>)}</tbody><tfoot><tr className="bg-secondary/50"><td className={`${tdClass} font-semibold`}>Grand total</td><td className={`${tdClass} text-right font-mono`}>{state.products.length}</td><td className={`${tdClass} text-right font-mono`}>{total ? "100%" : "0%"}</td><td className={`${tdClass} text-right font-mono font-semibold`}>{money.format(total)}</td></tr></tfoot></table></div></section>
  </>;
}
