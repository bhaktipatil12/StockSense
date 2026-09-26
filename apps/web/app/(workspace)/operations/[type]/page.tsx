import { notFound } from "next/navigation";
import { OperationsView } from "../../../../src/components/operations/operations-view";
import type { OperationType } from "../../../../src/types/inventory";

const typeMap: Record<string, OperationType> = { receipts: "receipt", deliveries: "delivery", transfers: "transfer", adjustments: "adjustment" };

export default async function OperationsPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ status?: string; new?: string; product?: string }> }) {
  const [{ type }, { status, new: startNew, product }] = await Promise.all([params, searchParams]);
  if (!typeMap[type]) notFound();
  return <OperationsView type={typeMap[type]} initialStatus={status ?? "all"} startNew={startNew === "1"} initialProductId={product} />;
}
