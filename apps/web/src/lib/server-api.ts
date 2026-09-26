import "server-only";
import { cookies } from "next/headers";

export const sessionCookie = "stocksense_session";
const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function backendRequest(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const session = token ?? (await cookies()).get(sessionCookie)?.value;
  return fetch(`${backendUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(session ? { Authorization: `Bearer ${session}` } : {}),
      ...init.headers,
    },
  });
}
