export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Shown in the venue's local time zone for Indonesian users. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

/**
 * Turns the value of an <input type="datetime-local"> ("2026-11-05T19:30"), typed as Jakarta
 * time, into an exact ISO timestamp the API stores in UTC.
 */
export function jakartaLocalToIso(value: string): string {
  return new Date(`${value}:00+07:00`).toISOString();
}
