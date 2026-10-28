import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { apiGet, getCurrentUser } from "@/lib/server-api";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "My orders" };

const BADGES: Record<OrderStatus, string> = {
  pending: "bg-indigo-100 text-indigo-800",
  paid: "bg-emerald-100 text-emerald-800",
  expired: "bg-zinc-200 text-zinc-700",
  cancelled: "bg-zinc-200 text-zinc-700",
  failed: "bg-red-100 text-red-800",
};

export default async function OrdersPage() {
  if (!(await getCurrentUser())) redirect("/login?next=%2Forders");

  const { data: orders } = await apiGet<{ data: Order[] }>("/orders");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">My orders</h1>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500">
          You have no orders yet.{" "}
          <Link href="/" className="text-indigo-600 hover:underline">
            Find an event
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.code}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{order.showtime?.event?.title}</p>
                  <p className="text-sm text-zinc-600">
                    {order.showtime && formatDateTime(order.showtime.starts_at)} ·{" "}
                    {order.items?.map((i) => i.seat_label).join(", ")}
                  </p>
                </div>
                <div className="shrink-0 space-y-1 text-right">
                  <p className="text-sm font-medium">{formatRupiah(order.total_amount)}</p>
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${BADGES[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
