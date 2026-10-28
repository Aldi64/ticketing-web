import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api-error";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { apiGet } from "@/lib/server-api";
import type { EventSummary, Showtime } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

async function loadEvent(slug: string): Promise<EventSummary> {
  try {
    const { data } = await apiGet<{ data: EventSummary }>(`/events/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);

  return { title: event.title, description: event.description ?? undefined };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  const showtimes = event.showtimes ?? [];

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-indigo-600 hover:underline">
        ← All events
      </Link>

      <div className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
          {event.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.poster_url} alt={event.title} className="h-full w-full object-cover" />
          )}
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{event.category}</span>
          <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
          {event.description && <p className="whitespace-pre-line text-zinc-700">{event.description}</p>}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Showtimes</h2>

        {showtimes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            No upcoming showtimes.
          </p>
        ) : (
          <ul className="space-y-3">
            {showtimes.map((showtime) => (
              <ShowtimeRow key={showtime.id} showtime={showtime} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ShowtimeRow({ showtime }: { showtime: Showtime }) {
  const soldOut = showtime.availability?.sold_out ?? false;
  const prices = [...(showtime.prices ?? [])].sort((a, b) => b.price - a.price);

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-semibold">{formatDateTime(showtime.starts_at)}</p>
        {showtime.venue && (
          <p className="text-sm text-zinc-600">
            {showtime.venue.name}, {showtime.venue.city}
          </p>
        )}

        <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm text-zinc-700">
          {prices.map((tier) => (
            <li key={tier.seat_section_id}>
              {tier.section_name}: <span className="font-medium">{formatRupiah(tier.price)}</span>
            </li>
          ))}
        </ul>

        {showtime.availability && !soldOut && (
          <p className="text-xs text-zinc-500">
            {showtime.availability.available} of {showtime.availability.total} seats left
          </p>
        )}
      </div>

      {soldOut ? (
        <span className="rounded-md bg-zinc-100 px-4 py-2 text-center text-sm font-semibold text-zinc-500">
          Sold out
        </span>
      ) : (
        <Link
          href={`/showtimes/${showtime.id}`}
          className="rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Choose seats
        </Link>
      )}
    </li>
  );
}
