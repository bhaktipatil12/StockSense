import type { ReactNode } from "react";
import type { OperationStatus } from "../../types/inventory";
import { Icon } from "./icon";

export const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-strong px-4 py-2 text-sm font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-ink-accent active:scale-[.98] disabled:cursor-not-allowed disabled:bg-muted disabled:text-ink-muted disabled:active:scale-100";
export const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border-strong bg-white px-4 py-2 text-sm font-medium text-ink transition-[background-color,border-color,color,transform] duration-150 hover:border-brand-strong hover:bg-brand-soft hover:text-brand-strong active:scale-[.98]";
export const inputClass = "min-h-10 w-full rounded-md border border-border-strong bg-white px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink-subtle transition-colors hover:border-ink-subtle focus:border-brand-strong focus:ring-0 focus-visible:outline-none";
export const labelClass = "grid gap-1.5 text-sm font-medium text-foreground";
export const tableClass = "w-full min-w-[720px] border-collapse text-left text-sm";
export const thClass = "border-b border-border px-4 py-3 text-xs font-semibold text-ink-muted";
export const tdClass = "border-b border-border-subtle px-4 py-3.5 align-middle";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[.12em] text-ink-muted">{eyebrow}</p><h1 className="m-0 font-sans text-2xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-1.5 text-sm leading-6 text-ink-muted">{description}</p></div>{action}</header>;
}

export function StatusBadge({ status, className = "" }: { status: OperationStatus | "Low" | "Out"; className?: string }) {
  const tone = { Draft: "bg-idle-wash text-idle-ink", Waiting: "bg-warn-wash text-warn-ink", Ready: "bg-info-wash text-info-ink", Done: "bg-ok-wash text-ok-ink", Canceled: "bg-bad-wash text-bad-ink", Low: "bg-warn-wash text-warn-ink", Out: "bg-bad-wash text-bad-ink" }[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${tone} ${className}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><h3 className="text-base font-semibold text-foreground">{title}</h3><p className="mt-1 max-w-sm text-sm leading-6 text-ink-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block min-w-0 w-full"><span className="sr-only">{placeholder}</span><Icon name="search" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-subtle" /><input className={`${inputClass} pl-9`} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function Drawer({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return <><button type="button" className="fixed inset-0 z-50 bg-panel/30" aria-label="Close panel" onClick={onClose} /><aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-white p-6 shadow-xl sm:p-8" role="dialog" aria-modal="true" aria-label={title}><div className="mb-8 flex items-start justify-between gap-4"><div><p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-ink-muted">StockSense</p><h2 className="text-2xl font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}</div><button className="rounded-md p-2 text-ink-muted hover:bg-brand-soft hover:text-brand-strong" type="button" aria-label="Close panel" onClick={onClose}><Icon name="close" /></button></div>{children}</aside></>;
}
