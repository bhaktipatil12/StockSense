import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StockSense | Inventory workspace",
  description: "A focused inventory workspace for stock operations and movement history.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="font-sans antialiased">{children}</body></html>;
}
