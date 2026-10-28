"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { ErrorBox } from "../error-box";
import { dangerButton } from "./ui";

export function CancelShowtimeButton({ showtimeId }: { showtimeId: number }) {
  const router = useRouter();

  const cancel = useMutation({
    mutationFn: () => api(`/organizer/showtimes/${showtimeId}/cancel`, { method: "POST" }),
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => {
          if (window.confirm("Cancel this showtime? Buyers can no longer pick seats for it.")) cancel.mutate();
        }}
        disabled={cancel.isPending}
        className={dangerButton}
      >
        Cancel showtime
      </button>
      <ErrorBox error={cancel.error} />
    </div>
  );
}
