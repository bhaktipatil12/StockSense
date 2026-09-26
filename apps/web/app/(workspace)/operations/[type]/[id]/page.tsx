import { notFound } from "next/navigation";
import { OperationDetailView } from "../../../../../src/components/operations/operation-detail-view";
import type { OperationType } from "../../../../../src/types/inventory";

const typeMap: Record<string, OperationType> = { receipts: "receipt", deliveries: "delivery", transfers: "transfer", adjustments: "adjustment" };

export default async function OperationPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!typeMap[type]) notFound();
  return <OperationDetailView type={typeMap[type]} id={id} />;
}
