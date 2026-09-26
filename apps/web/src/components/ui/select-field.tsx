"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icon";

export interface SelectOption { value: string; label: string }
interface MenuBox { left: number; top: number; bottom: number; width: number; maxHeight: number; above: boolean }

export function SelectField({ value, onChange, options, label, className = "", disabled = false }: { value: string; onChange: (value: string) => void; options: SelectOption[]; label: string; className?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false);
    }
    function closeOnScroll(event: Event) {
      if (event.target instanceof Node && menu.current?.contains(event.target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("resize", closeOnScroll);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, []);

  function showMenu() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const placeAbove = below < 220 && above > below;
    setMenuBox({ left: rect.left, top: rect.bottom + 4, bottom: window.innerHeight - rect.top + 4, width: rect.width, maxHeight: Math.max(80, Math.min(240, placeAbove ? above : below)), above: placeAbove });
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setActiveIndex(selectedIndex); showMenu(); return; }
      setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
    if (open && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); choose(activeIndex); }
  }

  return <div ref={root} className={`relative min-w-0 ${className}`}>
    <button ref={trigger} type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-controls={listId} aria-expanded={open} onClick={() => { if (open) setOpen(false); else { setActiveIndex(selectedIndex); showMenu(); } }} onKeyDown={onKeyDown} className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md border bg-white px-3 text-left text-sm text-foreground transition-colors hover:border-ink-subtle focus-visible:border-brand-strong disabled:bg-secondary disabled:text-ink-muted ${open ? "border-brand-strong" : "border-border-strong"}`}><span className="truncate">{options[selectedIndex]?.label ?? "Select"}</span><Icon name="chevron" className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform duration-150 ${open ? "-rotate-90" : "rotate-90"}`} /></button>
    {open && menuBox && createPortal(<div ref={menu} id={listId} role="listbox" aria-label={label} style={menuBox.above ? { left: menuBox.left, bottom: menuBox.bottom, width: menuBox.width, maxHeight: menuBox.maxHeight } : { left: menuBox.left, top: menuBox.top, width: menuBox.width, maxHeight: menuBox.maxHeight }} className="fixed z-[80] overflow-y-auto rounded-md border border-border-strong bg-white p-1 shadow-[0_8px_24px_rgba(20,28,36,.12)]">{options.map((option, index) => <button key={option.value} type="button" role="option" aria-selected={value === option.value} tabIndex={-1} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)} className={`flex min-h-8 w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors ${activeIndex === index ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-secondary"} ${value === option.value ? "font-semibold" : ""}`}>{option.label}{value === option.value && <Icon name="check" className="h-3.5 w-3.5" />}</button>)}</div>, document.body)}
  </div>;
}
