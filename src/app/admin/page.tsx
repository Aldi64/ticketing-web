import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { apiGet } from "@/lib/server-api";
import type { AdminEvent, EventStatus, Paginated } from "@/lib/types";

export const metadata: Metadata = { title: "Event review" };

const TABS: { status: EventStatus; label: string; empty: string }[] = [
  { status: "pending_review", label: "Waiting for review", empty: "Nothing is waiting for review." },
  { status: "published", label: "Published", empty: "No published events yet." },
  { status: "rejected", label: "Rejected", empty: "No rejected events." },
  { status: "draft", label: "Drafts", empty: "No drafts." },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const tab = TABS.find((entry) => entry.status === first(params.status)) ?? TABS[0];
  const page = first(params.page);

  const events = await apiGet<Paginated<AdminEvent>>("/admin/events", { status: tab.status, page });
  const { current_page, last_page } = events.meta;

  const pageLink = (target: number) => `/admin?status=${tab.status}&page=${target}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Event review</h1>

      <nav className="flex flex-wrap gap-1 border-b border-zinc-200 pb-2 text-sm font-medium">
        {TABS.map((entry) => (
          <Link
            key={entry.status}
            href={`/admin?status=${entry.status}`}
            aria-current={entry.status === tab.status ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 ${
              entry.status === tab.status ? "bg-indigo-50 text-indigo-700" : "hover:bg-zinc-100"
            }`}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {events.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">{tab.empty}</p>
      ) : (
        <ul className="space-y-3">
          {events.data.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}`}
                className="flex gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
              >
                <div className="aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500">
                  {event.poster_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.poster_url} alt="" className="h-full w-full object-cover" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{event.title}</p>
                    <StatusBadge status={event.status} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{event.category}</p>
                  <p className="text-sm text-zinc-600">
                    {event.organizer ? `${event.organizer.name} (${event.organizer.email})` : "Unknown organizer"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {event.showtimes_count ?? 0} showtime{event.showtimes_count === 1 ? "" : "s"} · created{" "}
                    {formatDateTime(event.created_at)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {last_page > 1 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {current_page > 1 && (
            <Link href={pageLink(current_page - 1)} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5">
              Previous
            </Link>
          )}
          <span className="text-zinc-500">
            Page {current_page} of {last_page}
          </span>
          {current_page < last_page && (
            <Link href={pageLink(current_page + 1)} className="rounded-md border border-zinc-300 bg-white px-3 py-1.5">
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
