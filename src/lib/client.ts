import { ApiError, readBody } from "./api-error";

/**
 * Browser-side API call. It goes through our own /api/proxy route, which adds the
 * login token on the server. That means no CORS setup and no token in JavaScript.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;

  const response = await fetch(`/api/proxy${path}`, {
    method: init.method ?? "GET",
    // For FormData the browser sets the multipart Content-Type (with its boundary) itself.
    headers: {
      Accept: "application/json",
      ...(init.body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body === undefined ? undefined : isForm ? (init.body as FormData) : JSON.stringify(init.body),
  });

  const body = await readBody(response);

  if (!response.ok) throw ApiError.from(response.status, body);

  return body as T;
}

/** Calls our own auth route handlers (login, register, logout). */
export async function authRequest<T>(action: "login" | "register" | "logout", body?: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await readBody(response);

  if (!response.ok) throw ApiError.from(response.status, data);

  return data as T;
}
