import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CancelShowtimeButton } from "@/components/organizer/cancel-showtime-button";
import { EventActions } from "@/components/organizer/event-actions";
import { EventForm } from "@/components/organizer/event-form";
import { PosterUpload } from "@/components/organizer/poster-upload";
import { ShowtimeForm } from "@/components/organizer/showtime-form";
import { StatusBadge } from "@/components/status-badge";
import { ApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/server-api";
import type { OrganizerEvent, Venue } from "@/lib/types";

export const metadata: Metadata = { title: "Manage event" };

export default async function OrganizerEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  let event: OrganizerEvent;
  try {
    event = (await apiGet<{ data: OrganizerEvent }>(`/organizer/events/${id}`)).data;
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const { data: venues } = await apiGet<{ data: Venue[] }>("/organizer/venues");

  const editable = event.status === "draft" || event.status === "rejected";
  const showtimes = event.showtimes ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/organizer" className="text-sm text-indigo-600 hover:underline">
          ← My events
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>

        {event.status === "rejected" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">An admin rejected this event.</p>
            {event.rejection_reason && <p className="mt-1">{event.rejection_reason}</p>}
            <p className="mt-1">Edit it below and submit it again.</p>
          </div>
        )}
        {event.status === "pending_review" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This event is waiting for an admin to review it. You can&apos;t edit it until they decide.
          </p>
        )}
        {event.status === "published" && (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            This event is live.{" "}
            <Link href={`/events/${event.slug}`} className="font-medium underline">
              View the public page
            </Link>
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <PosterUpload eventId={event.id} posterUrl={event.poster_url} />

        {editable ? (
          <EventForm event={event} />
        ) : (
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{event.category}</p>
            <p className="whitespace-pre-line text-sm text-zinc-700">{event.description}</p>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Showtimes</h2>

        {showtimes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            No showtimes yet. Add at least one before submitting for review.
          </p>
        ) : (
          <ul className="space-y-2">
            {showtimes.map((showtime) => (
              <li
                key={showtime.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm">
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
                  {showtime.seat_counts && (
                    <p className="text-xs text-zinc-500">
                      {showtime.seat_counts.sold} sold · {showtime.seat_counts.held} held ·{" "}
                      {showtime.seat_counts.available} available of {showtime.seat_counts.total}
                    </p>
                  )}
                </div>
                {showtime.status === "scheduled" && <CancelShowtimeButton showtimeId={showtime.id} />}
              </li>
            ))}
          </ul>
        )}

        <ShowtimeForm eventId={event.id} venues={venues} />
      </section>

      <EventActions eventId={event.id} status={event.status} />
    </div>
  );
}
