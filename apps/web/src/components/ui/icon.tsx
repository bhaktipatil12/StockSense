import type { ReactNode, SVGProps } from "react";

export type IconName = "dashboard" | "products" | "category" | "report" | "receipt" | "delivery" | "transfer" | "adjustment" | "history" | "warehouse" | "location" | "settings" | "search" | "plus" | "menu" | "panel" | "close" | "arrow" | "chevron" | "check" | "filter" | "user" | "download" | "logout";

const paths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  products: <><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z" /><path d="m3 7 9 4 9-4M12 11v10" /></>,
  category: <><path d="M3 5h11l7 7-9 9-9-9V5Z" /><circle cx="8" cy="9" r="1" /></>,
  report: <><path d="M4 20h16M7 16v-5m5 5V5m5 11V9" /></>,
  receipt: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M4 17v3h16v-3" /></>,
  delivery: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 17v3h16v-3" /></>,
  transfer: <><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></>,
  adjustment: <><path d="M4 7h16M4 17h16M8 4v6m8 4v6" /></>,
  history: <><path d="M4 4v6h6M4 10a8 8 0 1 1 2.3 5.7M12 7v5l3 2" /></>,
  warehouse: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" /><path d="M9 22V12h6v10" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.17l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.26 7.18l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9.91 3.18V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.91 10H21a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  panel: <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /></>,
  close: <path d="M5 5 19 19M19 5 5 19" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  check: <path d="m4 12 5 5L20 6" />,
  filter: <path d="M3 6h18M3 12h14M3 18h9" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
