import type { SVGProps } from "react";

/** A compact inventory crate mark shared by the sidebar and authentication screens. */
export function StockMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--vt-brand-strong)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="m12 2.5 9 5v9l-9 5-9-5v-9l9-5Z" />
    <path d="m3 7.5 9 5 9-5M12 12.5v9" />
    <path d="m8 4.7 9 5" />
  </svg>;
}
