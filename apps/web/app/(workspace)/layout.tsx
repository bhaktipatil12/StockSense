import type { ReactNode } from "react";
import { AppShell } from "../../src/components/layout/app-shell";
import { DemoProvider } from "../../src/context/demo-context";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <DemoProvider><AppShell>{children}</AppShell></DemoProvider>;
}
