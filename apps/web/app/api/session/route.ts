import { NextRequest, NextResponse } from "next/server";
import { backendRequest, sessionCookie } from "../../../src/lib/server-api";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("action" in body)) {
    return NextResponse.json({ detail: "Invalid request" }, { status: 400 });
  }
  const action = body.action;
  if (action !== "login" && action !== "signup") {
    return NextResponse.json({ detail: "Invalid action" }, { status: 400 });
  }
  try {
    const response = await backendRequest(`/auth/${action}`, { method: "POST", body: JSON.stringify(body) });
    const data: unknown = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    if (!data || typeof data !== "object" || !("access_token" in data) || typeof data.access_token !== "string") {
      return NextResponse.json({ detail: "Invalid authentication response" }, { status: 502 });
    }
    const result = NextResponse.json({ user: "user" in data ? data.user : null });
    result.cookies.set(sessionCookie, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return result;
  } catch {
    return NextResponse.json({ detail: "Inventory server is unavailable" }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Signed out" });
  response.cookies.delete(sessionCookie);
  return response;
}
