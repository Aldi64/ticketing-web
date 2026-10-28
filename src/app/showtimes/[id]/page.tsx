import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SeatPicker } from "@/components/seat-picker";
import { getCurrentUser } from "@/lib/server-api";

export const metadata: Metadata = { title: "Choose seats" };

export default async function ShowtimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  // Holding seats needs an account, so guests log in first and come back here.
  if (!(await getCurrentUser())) redirect(`/login?next=${encodeURIComponent(`/showtimes/${id}`)}`);

  return <SeatPicker showtimeId={Number(id)} />;
}
