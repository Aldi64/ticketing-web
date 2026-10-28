"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { jakartaLocalToIso } from "@/lib/format";
import type { Venue } from "@/lib/types";
import { ErrorBox } from "../error-box";
import { inputClass, primaryButton } from "./ui";

export function ShowtimeForm({ eventId, venues }: { eventId: number; venues: Venue[] }) {
  const router = useRouter();
  const [venueId, setVenueId] = useState<string>("");
  const [prices, setPrices] = useState<Record<number, string>>({});

  // The venue's sections tell us which prices to ask for.
  const venue = useQuery({
    queryKey: ["venue", venueId],
    queryFn: async () => (await api<{ data: Venue }>(`/organizer/venues/${venueId}`)).data,
    enabled: venueId !== "",
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api(`/organizer/events/${eventId}/showtimes`, { method: "POST", body }),
    onSuccess: () => {
      setPrices({});
      router.refresh();
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    create.mutate({
      venue_id: Number(venueId),
      starts_at: jakartaLocalToIso(String(form.get("starts_at"))),
      prices: (venue.data?.sections ?? []).map((section) => ({
        seat_section_id: section.id,
        price: Number(prices[section.id]),
      })),
    });
  }

  if (venues.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
        You need a venue before you can add showtimes.{" "}
        <a href="/organizer/venues/new" className="font-medium text-indigo-600 hover:underline">
          Create a venue
        </a>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold">Add a showtime</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Venue
          <select
            value={venueId}
            onChange={(e) => {
              setVenueId(e.target.value);
              setPrices({});
            }}
            required
            className={inputClass}
          >
            <option value="">Choose a venue…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.city})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Starts at (Jakarta time, WIB)
          <input name="starts_at" type="datetime-local" required className={inputClass} />
        </label>
      </div>

      {venueId !== "" && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Ticket price per section (Rp)</legend>
          {venue.isLoading && <p className="text-sm text-zinc-500">Loading sections…</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {venue.data?.sections?.map((section) => (
              <label key={section.id} className="block text-xs font-medium">
                {section.name} <span className="text-zinc-500">({section.seats_count} seats)</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={prices[section.id] ?? ""}
                  onChange={(e) => setPrices({ ...prices, [section.id]: e.target.value })}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <ErrorBox error={create.error} />

      <button type="submit" disabled={create.isPending || !venue.data} className={primaryButton}>
        {create.isPending ? "Adding…" : "Add showtime"}
      </button>
    </form>
  );
}
