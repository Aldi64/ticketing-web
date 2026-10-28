import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewActions } from "@/components/admin/review-actions";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/server-api";
import { hasUpcomingShowtime, priceRange } from "@/lib/showtimes";
import type { AdminEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Review event" };

export default async function AdminEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let event: AdminEvent;
  try {
    event = (await apiGet<{ data: AdminEvent }>(`/admin/events/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const showtimes = event.showtimes ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">
          ← Review queue
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>

        {event.status === "published" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            This event is published
            {event.reviewed_at ? ` (reviewed ${formatDateTime(event.reviewed_at)})` : ""}.{" "}
            <Link href={`/events/${event.slug}`} className="font-medium underline">
              View the public page
            </Link>
          </p>
        )}
        {event.status === "rejected" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">
              Rejected{event.reviewed_at ? ` on ${formatDateTime(event.reviewed_at)}` : ""}.
            </p>
            {event.rejection_reason && <p className="mt-1">{event.rejection_reason}</p>}
          </div>
        )}
        {event.status === "draft" && (
          <p className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700">
            This event is still a draft. The organizer has not submitted it for review.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
          {event.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.poster_url} alt="Event poster" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{event.category}</p>
            <p className="whitespace-pre-line text-sm text-zinc-700">{event.description}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm shadow-sm">
            <p className="font-semibold">Organizer</p>
            {event.organizer ? (
              <p className="text-zinc-600">
                {event.organizer.name} ({event.organizer.email})
              </p>
            ) : (
              <p className="text-zinc-500">Unknown</p>
            )}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Showtimes</h2>

        {showtimes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            This event has no showtimes.
          </p>
        ) : (
          <ul className="space-y-2">
            {showtimes.map((showtime) => {
              const price = priceRange(showtime.prices);

              return (
                <li key={showtime.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm">
                  <p className="font-semibold">
                    {formatDateTime(showtime.starts_at)}
                    {showtime.status === "cancelled" && (
                      <span className="ml-2 rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        Cancelled
                      </span>
                    )}
                  </p>
                  <p className="text-zinc-600">
                    {showtime.venue?.name}, {showtime.venue?.city}
                  </p>
                  {price && <p className="text-xs text-zinc-500">Tickets {price}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {event.status === "pending_review" && (
        <ReviewActions eventId={event.id} hasUpcomingShowtime={hasUpcomingShowtime(showtimes)} />
      )}
    </div>
  );
}
