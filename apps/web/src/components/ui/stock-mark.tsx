import type { SVGProps } from "react";

/** A small inventory crate mark shared by the sidebar and authentication screens. */
export function StockMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" {...props}>
    <rect x="1" y="1" width="30" height="30" rx="7" fill="#487aa8" />
    <path d="m16 6.5 8.5 4.7v9.6L16 25.5l-8.5-4.7v-9.6L16 6.5Z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m7.5 11.2 8.5 4.7 8.5-4.7M16 15.9v9.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m12 8.7 8.5 4.7" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}
