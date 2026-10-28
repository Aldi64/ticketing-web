import type { Metadata } from "next";
import Link from "next/link";
import { apiGet } from "@/lib/server-api";
import type { Venue } from "@/lib/types";

export const metadata: Metadata = { title: "Venues" };

export default async function VenuesPage() {
  const { data: venues } = await apiGet<{ data: Venue[] }>("/organizer/venues");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
        <Link
          href="/organizer/venues/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New venue
        </Link>
      </div>

      {venues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
          No venues yet. A venue defines the seat layout your showtimes use.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {venues.map((venue) => (
            <li key={venue.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="font-semibold">{venue.name}</p>
              <p className="text-sm text-zinc-600">
                {venue.address}, {venue.city}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {venue.sections_count} section(s) · {venue.seats_count} seats
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
