import Link from "next/link";
import { EventCard } from "@/components/event-card";
import { apiGet } from "@/lib/server-api";
import type { EventSummary, Paginated } from "@/lib/types";

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "film", label: "Film" },
  { value: "concert", label: "Concert" },
  { value: "orchestra", label: "Orchestra" },
  { value: "other", label: "Other" },
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.search);
  const category = first(params.category);
  const city = first(params.city);
  const page = first(params.page);

  const events = await apiGet<Paginated<EventSummary>>("/events", { search, category, city, page });

  const pageLink = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (city) query.set("city", city);
    query.set("page", String(target));
    return `/?${query.toString()}`;
  };

  const { current_page, last_page } = events.meta;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Upcoming events</h1>

      <form className="flex flex-wrap gap-2" action="/">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search events"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm sm:max-w-xs"
        />
        <input
          name="city"
          defaultValue={city}
          placeholder="City"
          className="w-32 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Filter
        </button>
      </form>

      {events.data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
          No events match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
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
