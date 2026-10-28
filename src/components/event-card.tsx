import Link from "next/link";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { EventSummary } from "@/lib/types";

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-indigo-500 to-fuchsia-500">
        {event.poster_url && (
          // Posters come from the API's storage, so a plain img avoids configuring remote image hosts.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.poster_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{event.category}</span>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug">{event.title}</h2>
        {event.next_showtime_at && (
          <p className="text-sm text-zinc-500">{formatDateTime(event.next_showtime_at)}</p>
        )}
        {event.min_price !== undefined && (
          <p className="mt-auto pt-2 text-sm font-medium">From {formatRupiah(event.min_price)}</p>
        )}
      </div>
    </Link>
  );
}
