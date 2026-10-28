import type { Metadata } from "next";
import { EventForm } from "@/components/organizer/event-form";

export const metadata: Metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">New event</h1>
      <EventForm />
    </div>
  );
}
