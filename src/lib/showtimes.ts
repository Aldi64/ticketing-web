import { formatRupiah } from "./format";
import type { OrganizerShowtime } from "./types";

/** True when at least one scheduled showtime has not started yet. The public catalog needs one. */
export function hasUpcomingShowtime(showtimes: OrganizerShowtime[]): boolean {
  const now = Date.now();
  return showtimes.some((showtime) => showtime.status === "scheduled" && new Date(showtime.starts_at).getTime() > now);
}

/** "Rp 50.000" for one price, "Rp 50.000 – Rp 150.000" for a range, null when there are no prices. */
export function priceRange(prices: { price: number }[] | undefined): string | null {
  if (!prices || prices.length === 0) return null;

  const values = prices.map((entry) => entry.price);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`;
}
