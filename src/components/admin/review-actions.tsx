"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api-error";
import { api } from "@/lib/client";
import { ErrorBox } from "../error-box";
import { dangerButton, inputClass, primaryButton, secondaryButton } from "../organizer/ui";

const rejectButton = "rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50";

const MIN_REASON = 10;
const MAX_REASON = 1000;

export function ReviewActions({ eventId, hasUpcomingShowtime }: { eventId: number; hasUpcomingShowtime: boolean }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  // A 409 means another admin already decided. Reloading shows their decision.
  const onError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) router.refresh();
  };

  const approve = useMutation({
    mutationFn: () => api(`/admin/events/${eventId}/approve`, { method: "POST" }),
    onSuccess: () => router.refresh(),
    onError,
  });

  const reject = useMutation({
    mutationFn: () => api(`/admin/events/${eventId}/reject`, { method: "POST", body: { reason: reason.trim() } }),
    onSuccess: () => router.refresh(),
    onError,
  });

  const busy = approve.isPending || reject.isPending;
  const trimmed = reason.trim().length;
  const reasonOk = trimmed >= MIN_REASON && trimmed <= MAX_REASON;

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Decision</h2>

      {!hasUpcomingShowtime && (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          This event has no upcoming showtime. If you approve it, it will not appear in the public catalog until it has
          one.
        </p>
      )}

      <ErrorBox error={approve.error ?? reject.error} />

      {rejecting ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (reasonOk) reject.mutate();
          }}
        >
          <label className="block text-sm font-medium">
            Reason for rejecting (the organizer will see this)
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              maxLength={MAX_REASON}
              className={inputClass}
              placeholder="Explain what needs to change before this event can be published."
            />
          </label>
          <p className="text-xs text-zinc-500">
            {trimmed} / {MAX_REASON} characters, at least {MIN_REASON}.
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy || !reasonOk} className={rejectButton}>
              {reject.isPending ? "Rejecting…" : "Reject event"}
            </button>
            <button type="button" disabled={busy} onClick={() => setRejecting(false)} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => approve.mutate()} disabled={busy} className={primaryButton}>
            {approve.isPending ? "Approving…" : "Approve and publish"}
          </button>
          <button onClick={() => setRejecting(true)} disabled={busy} className={dangerButton}>
            Reject…
          </button>
        </div>
      )}
    </section>
  );
}
