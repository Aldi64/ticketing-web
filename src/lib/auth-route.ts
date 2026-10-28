import "server-only";
import { NextResponse } from "next/server";
import { readBody } from "./api-error";
import { API_URL, TOKEN_COOKIE, TOKEN_MAX_AGE } from "./config";

/**
 * Shared by the login and register route handlers: forwards the request to Laravel,
 * stores the returned token in an httpOnly cookie and hides it from the browser.
 */
export async function forwardAuth(request: Request, endpoint: "login" | "register") {
  const payload = await request.json().catch(() => ({}));

  const upstream = await fetch(`${API_URL}/api/auth/${endpoint}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, device_name: "web" }),
    cache: "no-store",
  });

  const body = await readBody(upstream);

  if (!upstream.ok) {
    return NextResponse.json(body, { status: upstream.status });
  }

  const { token, user } = body as { token: string; user: unknown };
  const response = NextResponse.json({ user }, { status: upstream.status });

  response.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });

  return response;
}
