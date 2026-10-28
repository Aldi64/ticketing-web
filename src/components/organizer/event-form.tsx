"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { api } from "@/lib/client";
import type { OrganizerEvent } from "@/lib/types";
import { ErrorBox } from "../error-box";
import { inputClass, primaryButton } from "./ui";

const CATEGORIES = ["film", "concert", "orchestra", "other"];

/** Creates an event, or edits one when `event` is given. */
export function EventForm({ event }: { event?: OrganizerEvent }) {
  const router = useRouter();

  const save = useMutation({
    mutationFn: async (body: unknown) =>
      event
        ? api<{ data: OrganizerEvent }>(`/organizer/events/${event.id}`, { method: "PUT", body })
        : api<{ data: OrganizerEvent }>("/organizer/events", { method: "POST", body }),
    onSuccess: ({ data }) => {
      if (event) router.refresh();
      else router.push(`/organizer/events/${data.id}`);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate(Object.fromEntries(new FormData(e.currentTarget)));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <label className="block text-sm font-medium">
        Title
        <input name="title" required maxLength={255} defaultValue={event?.title} className={inputClass} />
      </label>

      <label className="block text-sm font-medium">
        Category
        <select name="category" defaultValue={event?.category ?? "concert"} className={`${inputClass} capitalize`}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          required
          maxLength={5000}
          rows={6}
          defaultValue={event?.description}
          className={inputClass}
        />
      </label>

      <ErrorBox error={save.error} />

      <button type="submit" disabled={save.isPending} className={primaryButton}>
        {save.isPending ? "Saving…" : event ? "Save changes" : "Create event"}
      </button>
      {save.isSuccess && event && <span className="ml-3 text-sm text-emerald-700">Saved.</span>}
    </form>
  );
}
