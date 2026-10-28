import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderView } from "@/components/order-view";
import { getCurrentUser } from "@/lib/server-api";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const { code } = await params;
  const { pay } = await searchParams;

  if (!(await getCurrentUser())) redirect(`/login?next=${encodeURIComponent(`/orders/${code}`)}`);

  return <OrderView code={code} autoPay={pay === "1"} />;
}
