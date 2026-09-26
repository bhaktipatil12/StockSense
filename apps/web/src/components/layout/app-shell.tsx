"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../ui/icon";
import { StockMark } from "../ui/stock-mark";
import { useDemo } from "../../context/demo-context";

interface NavItem { label: string; href: string; icon: IconName }
const overview: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "dashboard" },
  { label: "Products & stock", href: "/products", icon: "products" },
  { label: "Move history", href: "/moves", icon: "history" },
];
const operations: NavItem[] = [
  { label: "Receipts", href: "/operations/receipts", icon: "receipt" },
  { label: "Deliveries", href: "/operations/deliveries", icon: "delivery" },
  { label: "Internal transfers", href: "/operations/transfers", icon: "transfer" },
  { label: "Adjustments", href: "/operations/adjustments", icon: "adjustment" },
];
const configuration: NavItem[] = [
  { label: "Warehouses", href: "/settings/warehouses", icon: "warehouse" },
  { label: "Locations", href: "/settings/locations", icon: "location" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state } = useDemo();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  function navItem(item: NavItem) {
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return <Link key={item.href} href={item.href} title={item.label} className={`flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs font-medium transition-colors duration-150 ${active ? "bg-brand-soft font-semibold text-brand-strong" : "text-ink hover:bg-brand-soft/70 hover:text-brand-strong"} ${collapsed ? "justify-center px-0" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setMobileOpen(false)}><Icon name={item.icon} className="h-[15px] w-[15px] shrink-0" />{!collapsed && <span>{item.label}</span>}</Link>;
  }
  return <div className="flex h-dvh w-full gap-1 overflow-hidden bg-[#eaf0f6] p-1 font-sans text-foreground antialiased sm:gap-1.5 sm:p-1.5">
    {mobileOpen && <button className="fixed inset-0 z-40 bg-panel/30 md:hidden" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-2 left-2 z-50 flex w-[min(17rem,calc(100vw-1rem))] shrink-0 flex-col rounded-lg border border-border bg-white py-3 shadow-sm transition-transform duration-200 md:relative md:inset-auto md:h-full md:translate-x-0 md:shadow-none md:transition-[width] ${mobileOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]"} ${collapsed ? "md:w-14" : "md:w-[248px]"}`}>
      <div className={`flex items-center pb-3 ${collapsed ? "justify-center px-2" : "justify-between px-3"}`}>
        {collapsed ? <button type="button" className="group relative flex h-7 w-7 items-center justify-center rounded-md text-brand-strong hover:bg-brand-soft" aria-label="Expand sidebar" title="Expand sidebar" onClick={() => setCollapsed(false)}><StockMark className="h-7 w-7 group-hover:hidden" /><Icon name="panel" className="hidden h-4 w-4 group-hover:block" /></button> : <><Link href="/dashboard" className="flex items-center gap-2" title="StockSense home" onClick={() => setMobileOpen(false)}><StockMark className="h-7 w-7" /><span className="font-display text-[17px] font-medium leading-none tracking-tight">StockSense</span></Link><button type="button" className="hidden rounded-md p-1.5 text-ink-subtle transition-colors hover:bg-brand-soft hover:text-brand-strong md:block" aria-label="Collapse sidebar" onClick={() => setCollapsed(true)}><Icon name="panel" className="h-4 w-4" /></button><button type="button" className="rounded-md p-1.5 text-ink-muted md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><Icon name="close" className="h-4 w-4" /></button></>}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-2.5 pb-2">
        <nav aria-label="Workspace" className="space-y-0.5">{!collapsed && <p className="px-2.5 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-subtle">Workspace</p>}{overview.map(navItem)}</nav>
        <div className={collapsed ? "border-t border-border-subtle" : ""} />
        <nav aria-label="Operations" className="space-y-0.5">{!collapsed && <p className="px-2.5 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-subtle">Operations</p>}{operations.map(navItem)}</nav>
        <div className={collapsed ? "border-t border-border-subtle" : ""} />
        <nav aria-label="Settings" className="space-y-0.5">{!collapsed && <p className="px-2.5 pb-1 font-mono text-[10px] uppercase tracking-widest text-ink-subtle">Settings</p>}{configuration.map(navItem)}</nav>
      </div>
      <div className="border-t border-border px-2.5 pt-2"><Link href="/profile" title="Profile" className={`flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-brand-soft ${collapsed ? "justify-center" : ""}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-strong">{state.profileName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>{!collapsed && <span className="min-w-0"><span className="block truncate text-xs font-semibold">{state.profileName}</span><span className="block truncate text-[10px] text-ink-muted">Inventory manager</span></span>}</Link><Link href="/login" title="Sign out" className={`mt-1 flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-strong ${collapsed ? "justify-center px-0" : ""}`} onClick={() => setMobileOpen(false)}><Icon name="logout" className="h-[15px] w-[15px]" />{!collapsed && <span>Sign out</span>}</Link></div>
    </aside>
    <button type="button" className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-brand-strong shadow-sm transition-colors hover:bg-brand-soft md:hidden" aria-label="Open navigation" onClick={() => {setCollapsed(false);setMobileOpen(true);}}><Icon name="panel" className="h-[17px] w-[17px]" /></button>
    <main className="min-w-0 flex-1 overflow-y-auto rounded-lg border border-border bg-white pt-11 shadow-sm md:pt-0"><div className="mx-auto w-full max-w-[1500px] min-w-0 px-4 py-5 sm:p-7">{children}</div></main>
  </div>;
}
