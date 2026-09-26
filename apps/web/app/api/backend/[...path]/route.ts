import { NextRequest, NextResponse } from "next/server";
import { backendRequest, sessionCookie } from "../../../../src/lib/server-api";

const allowed = new Set(["auth", "products", "warehouses", "operations", "stock", "movements", "dashboard"]);

async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  if (!path.length || !allowed.has(path[0] ?? "") || path.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))) {
    return NextResponse.json({ detail: "Invalid API path" }, { status: 404 });
  }
  if (path[0] === "auth" && path[1] !== "me" && path[1] !== "password-reset") {
    return NextResponse.json({ detail: "Invalid API path" }, { status: 404 });
  }
  if (path[0] !== "auth" && !request.cookies.get(sessionCookie)?.value) {
    return NextResponse.json({ detail: "Sign in required" }, { status: 401 });
  }
  try {
    const url = `/${path.join("/")}${request.nextUrl.search}`;
    const body = request.method === "GET" ? undefined : await request.text();
    const upstream = await backendRequest(url, { method: request.method, body });
    const content = await upstream.text();
    return new NextResponse(content, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Inventory server is unavailable" }, { status: 503 });
  }
}

type Context = { params: Promise<{ path: string[] }> };
export async function GET(request: NextRequest, context: Context) { return proxy(request, (await context.params).path); }
export async function POST(request: NextRequest, context: Context) { return proxy(request, (await context.params).path); }
export async function PATCH(request: NextRequest, context: Context) { return proxy(request, (await context.params).path); }
export async function DELETE(request: NextRequest, context: Context) { return proxy(request, (await context.params).path); }
