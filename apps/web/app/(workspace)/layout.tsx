import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "../../src/components/layout/app-shell";
import { DemoProvider } from "../../src/context/demo-context";
import { backendRequest } from "../../src/lib/server-api";

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  try {
    const response = await backendRequest("/auth/me");
    if (!response.ok) redirect("/login");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/login");
  }
  return <DemoProvider><AppShell>{children}</AppShell></DemoProvider>;
}
