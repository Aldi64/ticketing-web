import type { ApiErrorBody } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: ApiErrorBody,
  ) {
    super(body.message ?? `Request failed with status ${status}`);
  }

  /** Builds an error from a failed response, whatever shape its body had. */
  static from(status: number, body: unknown): ApiError {
    return new ApiError(status, typeof body === "object" && body !== null ? (body as ApiErrorBody) : {});
  }

  /** First validation message for a field, if the API sent one. */
  field(name: string): string | undefined {
    return this.body.errors?.[name]?.[0];
  }
}

/**
 * Reads a response body as JSON. A failed response that is not JSON (a crash page, a PHP warning
 * printed before the JSON) becomes a readable message instead of an empty object.
 */
export async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return response.ok
      ? {}
      : { message: `The server sent an unexpected response (HTTP ${response.status}). Please try again.` };
  }
}
