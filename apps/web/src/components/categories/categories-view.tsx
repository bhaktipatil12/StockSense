"use client";

import { useState, type FormEvent } from "react";
import { useDemo } from "../../context/demo-context";
import type { Category } from "../../types/inventory";
import { Drawer, EmptyState, PageHeading, SearchField, inputClass, labelClass, primaryButton, secondaryButton, tableClass, tdClass, thClass } from "../ui/primitives";
import { SelectField } from "../ui/select-field";
import { Icon } from "../ui/icon";

export function CategoriesView() {
  const { state, addCategory, updateCategory, deleteCategory } = useDemo();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [message, setMessage] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const categories = state.categories.filter((category) => category.name.toLowerCase().includes(search.toLowerCase()));

  function start(category?: Category) {
    setEditing(category ?? null);
    setName(category?.name ?? "");
    setParentId(category?.parentId ?? "");
    setMessage("");
    setOpen(true);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = editing ? updateCategory(editing.id, name, parentId || undefined) : addCategory(name, parentId || undefined);
    if (result.ok) { setOpen(false); setMessage(result.message); }
    else setMessage(result.message);
  }

  function remove(category: Category) {
    if (confirmId !== category.id) { setConfirmId(category.id); return; }
    const result = deleteCategory(category.id);
    setMessage(result.message);
    if (result.ok) setConfirmId(null);
  }

  function actions(category: Category) {
    return <div className="flex items-center gap-2"><button type="button" className="rounded-md px-2 py-1 text-xs font-medium text-brand-strong hover:bg-brand-soft" onClick={() => start(category)}>Edit</button><button type="button" className="rounded-md px-2 py-1 text-xs font-medium text-bad-ink hover:bg-bad-wash" onClick={() => remove(category)}>{confirmId === category.id ? "Confirm delete" : "Delete"}</button>{confirmId === category.id && <button type="button" className="text-xs text-ink-muted hover:underline" onClick={() => setConfirmId(null)}>Keep</button>}</div>;
  }

  return <>
    <PageHeading eyebrow="Catalog" title="Categories" description="Organize products into categories and subcategories." action={<button className={primaryButton} type="button" onClick={() => start()}><Icon name="plus" className="h-4 w-4" />Add category</button>} />
    <div className="mb-5 max-w-md"><SearchField value={search} onChange={setSearch} placeholder="Search categories" /></div>
    {message && !open && <p role="status" className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-strong">{message}</p>}
    <div className="mb-3 flex items-baseline gap-2"><h2 className="text-sm font-semibold">Categories</h2><span className="font-mono text-xs text-ink-muted">{categories.length}</span></div>
    {categories.length ? <><div className="space-y-2 sm:hidden">{categories.map((category) => <div key={category.id} className="rounded-lg border border-border p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">{category.name}</h3><p className="mt-1 text-xs text-ink-muted">{category.parentId ? state.categories.find((item) => item.id === category.parentId)?.name : "Top level"}</p></div><span className="font-mono text-xs text-ink-muted">{state.products.filter((product) => product.category === category.name).length} products</span></div><div className="mt-3 border-t border-border-subtle pt-2">{actions(category)}</div></div>)}</div><div className="hidden overflow-x-auto rounded-lg border border-border sm:block"><table className={tableClass}><thead><tr><th className={thClass}>Category</th><th className={thClass}>Parent</th><th className={thClass}>Products</th><th className={thClass}>Subcategories</th><th className={`${thClass} text-right`}>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category.id} className="hover:bg-brand-soft/40"><td className={`${tdClass} font-medium`}>{category.name}</td><td className={tdClass}>{category.parentId ? state.categories.find((item) => item.id === category.parentId)?.name : "Top level"}</td><td className={`${tdClass} font-mono text-xs`}>{state.products.filter((product) => product.category === category.name).length}</td><td className={`${tdClass} font-mono text-xs`}>{state.categories.filter((item) => item.parentId === category.id).length}</td><td className={`${tdClass} text-right`}><div className="flex justify-end">{actions(category)}</div></td></tr>)}</tbody></table></div></> : <div className="rounded-lg border border-border"><EmptyState title="No categories match" description="Try a different name or add a category." /></div>}
    {open && <Drawer title={editing ? "Edit category" : "Add category"} onClose={() => setOpen(false)}><form onSubmit={save} className="space-y-5"><label className={labelClass}>Name<input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Components" required /></label><div className={labelClass}><span>Parent category</span><SelectField label="Parent category" value={parentId} onChange={setParentId} options={[{ value: "", label: "Top level" }, ...state.categories.filter((category) => category.id !== editing?.id).map((category) => ({ value: category.id, label: category.name }))]} /></div>{message && <p role="alert" className="rounded-md bg-bad-wash px-3 py-2 text-sm text-bad-ink">{message}</p>}<div className="flex justify-end gap-2"><button className={secondaryButton} type="button" onClick={() => setOpen(false)}>Cancel</button><button className={primaryButton} type="submit">{editing ? "Save changes" : "Add category"}</button></div></form></Drawer>}
  </>;
}
