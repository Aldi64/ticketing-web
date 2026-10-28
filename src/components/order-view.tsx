"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-error";
import { api } from "@/lib/client";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { payWithSnap } from "@/lib/snap";
import type { Order } from "@/lib/types";
import { formatCountdown, useCountdown } from "@/lib/use-countdown";

export function OrderView({ code, autoPay }: { code: string; autoPay: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = ["order", code];
  const [payError, setPayError] = useState<string | null>(null);

  const { data: order, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => (await api<{ data: Order }>(`/orders/${code}`)).data,
    // Keep checking while unpaid, so the page flips to "paid" without a manual refresh.
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 4000 : false),
  });

  /** Asks the API to pull the payment status from Midtrans (works without the webhook, too). */
  const sync = useMutation({
    mutationFn: async () => (await api<{ data: Order }>(`/orders/${code}/sync`, { method: "POST" })).data,
    onSuccess: (fresh) => queryClient.setQueryData(queryKey, fresh),
  });

  const cancel = useMutation({
    mutationFn: async () => (await api<{ data: Order }>(`/orders/${code}/cancel`, { method: "POST" })).data,
    onSuccess: (fresh) => queryClient.setQueryData(queryKey, fresh),
  });

  const secondsLeft = useCountdown(order?.status === "pending" ? order.expires_at : null);

  async function pay(current: Order) {
    if (!current.snap_token || !current.snap_js_url || !current.client_key) return;
    setPayError(null);

    try {
      await payWithSnap({
        scriptUrl: current.snap_js_url,
        clientKey: current.client_key,
        token: current.snap_token,
        onSuccess: () => sync.mutate(),
        onPending: () => sync.mutate(),
        onError: () => setPayError("The payment failed. You can try again."),
        onClose: () => sync.mutate(),
      });
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Could not open the payment popup.");
    }
  }

  // Coming straight from checkout (?pay=1): open the payment popup once.
  const opened = useRef(false);
  useEffect(() => {
    if (autoPay && order?.status === "pending" && !opened.current) {
      opened.current = true;
      void pay(order);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPay, order?.status]);

  if (isLoading) return <p className="py-20 text-center text-zinc-500">Loading order…</p>;

  if (error || !order) {
    return (
      <div className="space-y-3 py-20 text-center">
        <p className="text-zinc-700">
          {error instanceof ApiError && error.status === 404 ? "Order not found." : "Could not load this order."}
        </p>
        <Link href="/orders" className="text-indigo-600 hover:underline">
          Your orders
        </Link>
      </div>
    );
  }

  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/orders" className="text-sm text-indigo-600 hover:underline">
        ← Your orders
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{order.showtime?.event?.title ?? "Your order"}</h1>
        {order.showtime && (
          <p className="text-sm text-zinc-600">
            {formatDateTime(order.showtime.starts_at)}
            {order.showtime.venue && ` · ${order.showtime.venue.name}, ${order.showtime.venue.city}`}
          </p>
        )}
        <p className="text-xs text-zinc-500">Order {order.code}</p>
      </div>

      <StatusBanner order={order} secondsLeft={secondsLeft} />

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm">
        {order.items?.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="font-medium">{item.seat_label}</span>
            <span>{formatRupiah(item.price)}</span>
          </li>
        ))}
        <li className="flex items-center justify-between px-4 py-3 font-semibold">
          <span>Total</span>
          <span>{formatRupiah(order.total_amount)}</span>
        </li>
      </ul>

      {order.status === "pending" && (
        <div className="space-y-3">
          {payError && <p className="text-sm text-red-600">{payError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => pay(order)}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Pay now
            </button>
            <button
              onClick={() => sync.mutate()}
              disabled={sync.isPending}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
            >
              {sync.isPending ? "Checking…" : "I've paid, check status"}
            </button>
            <button
              onClick={() => cancel.mutate()}
              disabled={cancel.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Cancel order
            </button>
          </div>
        </div>
      )}

      {paid && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Your tickets</h2>
          <p className="text-sm text-zinc-600">Show the QR code at the entrance.</p>

          <div className="grid gap-3 sm:grid-cols-2">
            {order.items?.map(
              (item) =>
                item.ticket && (
                  <div
                    key={item.id}
                    className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <QRCodeSVG value={item.ticket.code} size={150} />
                    <p className="font-semibold">{item.seat_label}</p>
                    <p className="font-mono text-xs tracking-wider text-zinc-500">{item.ticket.code}</p>
                    {item.ticket.checked_in_at && (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">Used</span>
                    )}
                  </div>
                ),
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBanner({ order, secondsLeft }: { order: Order; secondsLeft: number | null }) {
  switch (order.status) {
    case "pending":
      return (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
          Waiting for payment.{" "}
          {secondsLeft !== null && (
            <>
              Your seats are reserved for <strong>{formatCountdown(secondsLeft)}</strong>.
            </>
          )}
        </div>
      );
    case "paid":
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Payment received{order.paid_at && ` on ${formatDateTime(order.paid_at)}`}. Your tickets are below.
        </div>
      );
    case "expired":
      return <Banner tone="zinc">This order expired before it was paid. The seats were released.</Banner>;
    case "cancelled":
      return <Banner tone="zinc">This order was cancelled.</Banner>;
    default:
      return <Banner tone="red">The payment did not go through. You can pick your seats again.</Banner>;
  }
}

function Banner({ tone, children }: { tone: "zinc" | "red"; children: React.ReactNode }) {
  const classes =
    tone === "red" ? "border-red-200 bg-red-50 text-red-900" : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return <div className={`rounded-xl border p-4 text-sm ${classes}`}>{children}</div>;
}
