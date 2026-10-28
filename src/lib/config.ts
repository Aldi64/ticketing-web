export const API_URL = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export const TOKEN_COOKIE = "ticketing_token";

/** Cookie lifetime, matches the 30 day Sanctum token expiry on the API. */
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
