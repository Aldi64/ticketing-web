import type { EventStatus } from "@/lib/types";

const STYLES: Record<EventStatus, string> = {
  draft: "bg-zinc-200 text-zinc-700",
  pending_review: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

const LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  published: "Published",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}
