import "server-only";
import { cookies } from "next/headers";
import { ApiError, readBody } from "./api-error";
import { API_URL, TOKEN_COOKIE } from "./config";
import type { User } from "./types";

/**
 * Calls the Laravel API from the server (pages, route handlers).
 * The token lives in an httpOnly cookie, so only server code can read it.
 */
export async function apiGet<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(`${API_URL}/api${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await readBody(response);

  if (!response.ok) throw ApiError.from(response.status, body);

  return body as T;
}

/** The logged-in user, or null for guests and expired tokens. */
export async function getCurrentUser(): Promise<User | null> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { user } = await apiGet<{ user: User }>("/auth/me");
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
