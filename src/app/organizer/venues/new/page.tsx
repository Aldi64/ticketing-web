import type { Metadata } from "next";
import { VenueForm } from "@/components/organizer/venue-form";

export const metadata: Metadata = { title: "New venue" };

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">New venue</h1>
      <VenueForm />
    </div>
  );
}
