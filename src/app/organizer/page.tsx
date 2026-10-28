import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/server-api";
import type { OrganizerEvent, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "My events" };

export default async function OrganizerEventsPage() {
  const { data: events } = await apiGet<Paginated<OrganizerEvent>>("/organizer/events");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My events</h1>
        <Link
          href="/organizer/events/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
          You have no events yet. Create a venue first, then your first event.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/organizer/events/${event.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{event.title}</p>
                  <p className="text-sm text-zinc-500">
                    <span className="capitalize">{event.category}</span> · {event.showtimes_count ?? 0} showtime(s) ·
                    created {formatDateTime(event.created_at)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
