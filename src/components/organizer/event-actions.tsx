"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { EventStatus } from "@/lib/types";
import { ErrorBox } from "../error-box";
import { dangerButton, primaryButton } from "./ui";

export function EventActions({ eventId, status }: { eventId: number; status: EventStatus }) {
  const router = useRouter();

  const submit = useMutation({
    mutationFn: () => api(`/organizer/events/${eventId}/submit`, { method: "POST" }),
    onSuccess: () => router.refresh(),
  });

  const remove = useMutation({
    mutationFn: () => api(`/organizer/events/${eventId}`, { method: "DELETE" }),
    onSuccess: () => {
      router.push("/organizer");
      router.refresh();
    },
  });

  const canSubmit = status === "draft" || status === "rejected";

  return (
    <section className="space-y-3 border-t border-zinc-200 pt-6">
      <ErrorBox error={submit.error ?? remove.error} />

      <div className="flex flex-wrap gap-2">
        {canSubmit && (
          <button onClick={() => submit.mutate()} disabled={submit.isPending} className={primaryButton}>
            {submit.isPending ? "Submitting…" : "Submit for review"}
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm("Delete this event? This cannot be undone.")) remove.mutate();
          }}
          disabled={remove.isPending}
          className={dangerButton}
        >
          Delete event
        </button>
      </div>
    </section>
  );
}
