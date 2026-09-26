import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatQuantity(qty: number, unit: string): string {
  const formatted = Number.isInteger(qty) ? qty.toString() : qty.toFixed(3);
  return `${formatted} ${unit}`;
}

export type StatusType = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";

export function getStatusStyle(status: StatusType): string {
  switch (status) {
    case "DRAFT":
      return "bg-white text-black border border-[var(--border)]";
    case "WAITING":
      return "bg-[var(--warning)] text-black";
    case "READY":
      return "bg-[var(--secondary)] text-[var(--secondary-foreground)]";
    case "DONE":
      return "bg-[var(--primary)] text-white";
    case "CANCELLED":
      return "bg-[var(--destructive)] text-white";
    default:
      return "bg-white text-black";
  }
}

export function getOperationTypeLabel(type: string): string {
  switch (type) {
    case "RECEIPT": return "Receipt";
    case "DELIVERY": return "Delivery";
    case "TRANSFER": return "Transfer";
    case "ADJUSTMENT": return "Adjustment";
    default: return type;
  }
}

export function getOperationPrefix(type: string): string {
  switch (type) {
    case "RECEIPT": return "WH/IN";
    case "DELIVERY": return "WH/OUT";
    case "TRANSFER": return "WH/INT";
    case "ADJUSTMENT": return "WH/ADJ";
    default: return "WH/OP";
  }
}

export function apiResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function apiError(code: string, message: string, status = 400) {
  return Response.json({ error: { code, message } }, { status });
}
