"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/lib/api-error";
import { api } from "@/lib/client";
import { formatDateTime, formatRupiah } from "@/lib/format";
import type { Order, Seat, SeatMap } from "@/lib/types";
import { formatCountdown, useCountdown } from "@/lib/use-countdown";

const MAX_SEATS = 6;

// Full class names so Tailwind can see them.
const TONES = [
  { seat: "border-amber-400 bg-amber-50 hover:bg-amber-100", dot: "bg-amber-400" },
  { seat: "border-sky-400 bg-sky-50 hover:bg-sky-100", dot: "bg-sky-400" },
  { seat: "border-emerald-400 bg-emerald-50 hover:bg-emerald-100", dot: "bg-emerald-400" },
  { seat: "border-rose-400 bg-rose-50 hover:bg-rose-100", dot: "bg-rose-400" },
];

interface SeatMapResult {
  data: SeatMap;
  meta: { server_time: string };
}

export function SeatPicker({ showtimeId }: { showtimeId: number }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const queryKey = useMemo(() => ["seatmap", showtimeId], [showtimeId]);

  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await api<SeatMapResult>(`/showtimes/${showtimeId}/seats`);
      // How far the server clock is from this device's clock, for the countdown.
      return { ...result, clockOffset: new Date(result.meta.server_time).getTime() - Date.now() };
    },
    refetchInterval: 5000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const hold = useMutation({
    mutationFn: (ids: number[]) =>
      api(`/showtimes/${showtimeId}/hold`, { method: "POST", body: { seat_ids: ids } }),
    onSuccess: () => {
      setSelected([]);
      setMessage(null);
      refresh();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 409) {
        const gone: number[] = (e.body as { unavailable_seat_ids?: number[] }).unavailable_seat_ids ?? [];
        setSelected((current) => current.filter((id) => !gone.includes(id)));
        setMessage("Some of those seats were just taken. Pick different ones.");
        refresh();
      } else {
        setMessage(e instanceof ApiError ? e.message : "Something went wrong.");
      }
    },
  });

  const release = useMutation({
    mutationFn: () => api(`/showtimes/${showtimeId}/hold`, { method: "DELETE" }),
    onSuccess: () => {
      setMessage(null);
      refresh();
    },
  });

  const checkout = useMutation({
    mutationFn: async () => {
      try {
        const { data: order } = await api<{ data: Order }>(`/showtimes/${showtimeId}/orders`, { method: "POST" });
        return order.code;
      } catch (e) {
        // The seats already belong to an unpaid order (the user left checkout): resume it.
        if (e instanceof ApiError && e.status === 422) {
          const { data: orders } = await api<{ data: Order[] }>("/orders");
          const pending = orders.find((o) => o.status === "pending" && o.showtime?.id === showtimeId);
          if (pending) return pending.code;
        }
        throw e;
      }
    },
    onSuccess: (code) => router.push(`/orders/${code}?pay=1`),
    onError: (e) => {
      setMessage(e instanceof ApiError ? e.message : "Something went wrong.");
      refresh();
    },
  });

  const map = data?.data;
  const mine = useMemo(() => map?.seats.filter((s) => s.mine) ?? [], [map]);
  const holding = mine.length > 0;
  const deadline = holding
    ? mine.map((s) => s.held_until).filter((d): d is string => d !== null).sort()[0] ?? null
    : null;
  const secondsLeft = useCountdown(deadline, data?.clockOffset ?? 0);

  // When the hold runs out, ask the server so the seats show as available again.
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    if (holding && secondsLeft === 0 && deadline && refreshedFor.current !== deadline) {
      refreshedFor.current = deadline;
      queryClient.invalidateQueries({ queryKey });
    }
  }, [holding, secondsLeft, deadline, queryClient, queryKey]);

  const rows = useMemo(() => {
    const grouped = new Map<string, Seat[]>();
    for (const seat of map?.seats ?? []) {
      grouped.set(seat.row_label, [...(grouped.get(seat.row_label) ?? []), seat]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [map]);

  if (isLoading) return <p className="py-20 text-center text-zinc-500">Loading seats…</p>;

  if (error || !map) {
    return (
      <div className="space-y-3 py-20 text-center">
        <p className="text-zinc-700">
          {error instanceof ApiError && error.status === 404
            ? "This showtime is not available for booking."
            : "Could not load the seat map."}
        </p>
        <Link href="/" className="text-indigo-600 hover:underline">
          Back to events
        </Link>
      </div>
    );
  }

  const sectionIndex = new Map(map.sections.map((s, i) => [s.id, i]));
  const sectionName = new Map(map.sections.map((s) => [s.id, s.name]));
  const seatLabel = (s: Seat) => `${sectionName.get(s.section_id)}-${s.row_label}${s.seat_number}`;

  const chosen = holding ? mine : map.seats.filter((s) => selected.includes(s.id));
  const total = chosen.reduce((sum, s) => sum + s.price, 0);

  function toggle(seat: Seat) {
    if (holding || seat.status !== "available") return;

    if (selected.includes(seat.id)) {
      setSelected(selected.filter((id) => id !== seat.id));
      setMessage(null);
    } else if (selected.length >= MAX_SEATS) {
      setMessage(`You can choose up to ${MAX_SEATS} seats.`);
    } else {
      setSelected([...selected, seat.id]);
      setMessage(null);
    }
  }

  function seatClass(seat: Seat) {
    const base = "h-8 w-8 shrink-0 rounded-md border text-[10px] font-medium transition sm:h-9 sm:w-9";
    if (seat.mine || selected.includes(seat.id)) return `${base} border-indigo-600 bg-indigo-600 text-white`;
    if (seat.status === "sold") return `${base} cursor-not-allowed border-zinc-200 bg-zinc-200 text-zinc-400`;
    if (seat.status === "held") return `${base} cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 line-through`;
    return `${base} ${TONES[(sectionIndex.get(seat.section_id) ?? 0) % TONES.length].seat}`;
  }

  return (
    <div className="space-y-6 pb-40">
      <div>
        <Link href={`/events/${map.showtime.event.slug}`} className="text-sm text-indigo-600 hover:underline">
          ← {map.showtime.event.title}
        </Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Choose your seats</h1>
        <p className="text-sm text-zinc-600">
          {formatDateTime(map.showtime.starts_at)} · {map.showtime.venue.name}, {map.showtime.venue.city}
        </p>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {map.sections.map((section, i) => (
          <li key={section.id} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-sm ${TONES[i % TONES.length].dot}`} />
            {section.name} <span className="text-zinc-500">{formatRupiah(section.price)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-indigo-600" /> Yours
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-zinc-300" /> Taken
        </li>
      </ul>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mx-auto w-max min-w-full">
          <div className="mx-auto mb-6 w-2/3 rounded-b-full bg-zinc-200 py-1 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Stage / Screen
          </div>

          <div className="flex flex-col items-center gap-1.5">
            {rows.map(([row, seats]) => (
              <div key={row} className="flex items-center gap-1.5">
                <span className="w-5 text-center text-xs font-semibold text-zinc-500">{row}</span>
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggle(seat)}
                    disabled={holding || seat.status !== "available"}
                    aria-pressed={seat.mine || selected.includes(seat.id)}
                    aria-label={`${seatLabel(seat)}, ${formatRupiah(seat.price)}, ${seat.mine ? "yours" : seat.status}`}
                    className={seatClass(seat)}
                  >
                    {seat.seat_number}
                  </button>
                ))}
                <span className="w-5 text-center text-xs font-semibold text-zinc-500">{row}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0 space-y-0.5 text-sm">
            {chosen.length === 0 ? (
              <p className="text-zinc-500">Tap seats to select them (up to {MAX_SEATS}).</p>
            ) : (
              <>
                <p className="truncate font-medium">{chosen.map(seatLabel).join(", ")}</p>
                <p className="text-zinc-600">
                  {chosen.length} {chosen.length === 1 ? "seat" : "seats"} · <strong>{formatRupiah(total)}</strong>
                  {holding && secondsLeft !== null && (
                    <span className={secondsLeft <= 60 ? "ml-2 font-semibold text-red-600" : "ml-2 text-indigo-600"}>
                      Held for {formatCountdown(secondsLeft)}
                    </span>
                  )}
                </p>
              </>
            )}
            {message && <p className="text-red-600">{message}</p>}
          </div>

          <div className="flex shrink-0 gap-2">
            {holding ? (
              <>
                <button
                  onClick={() => release.mutate()}
                  disabled={release.isPending || checkout.isPending}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                >
                  Release seats
                </button>
                <button
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                  className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {checkout.isPending ? "Please wait…" : "Continue to payment"}
                </button>
              </>
            ) : (
              <button
                onClick={() => hold.mutate(selected)}
                disabled={selected.length === 0 || hold.isPending}
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {hold.isPending ? "Holding…" : "Hold seats"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
