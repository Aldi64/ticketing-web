import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/config";

/**
 * Forwards browser requests to the Laravel API and adds the Bearer token from the
 * httpOnly cookie. Login and register are NOT allowed here, because their responses
 * contain the raw token; they have their own handlers that keep it out of the browser.
 */
const BLOCKED = new Set(["auth/login", "auth/register"]);

async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = path.join("/");

  if (BLOCKED.has(target)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const jar = await cookies();
  const token = jar.get(TOKEN_COOKIE)?.value;
  const url = new URL(request.url);
  const hasBody = !["GET", "HEAD"].includes(request.method);

  const upstream = await fetch(`${API_URL}/api/${target}${url.search}`, {
    method: request.method,
    headers: {
      Accept: "application/json",
      ...(hasBody ? { "Content-Type": request.headers.get("content-type") ?? "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  // 204 and friends must not carry a body at all.
  const noBody = [204, 205, 304].includes(upstream.status);
  const response = new NextResponse(noBody ? null : await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });

  // An expired or revoked token: drop the cookie so the UI shows the logged-out state.
  if (upstream.status === 401 && token) response.cookies.delete(TOKEN_COOKIE);

  return response;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
