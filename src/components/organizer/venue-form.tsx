"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/client";
import { ErrorBox } from "../error-box";
import { dangerButton, inputClass, primaryButton, secondaryButton } from "./ui";

interface SectionDraft {
  name: string;
  rows: number;
  seats_per_row: number;
}

const MAX_ROWS = 26;

export function VenueForm() {
  const router = useRouter();
  const [sections, setSections] = useState<SectionDraft[]>([{ name: "Regular", rows: 5, seats_per_row: 10 }]);

  const totalRows = sections.reduce((sum, s) => sum + s.rows, 0);
  const totalSeats = sections.reduce((sum, s) => sum + s.rows * s.seats_per_row, 0);

  const create = useMutation({
    mutationFn: (body: unknown) => api("/organizer/venues", { method: "POST", body }),
    onSuccess: () => {
      router.push("/organizer/venues");
      router.refresh();
    },
  });

  function update(index: number, patch: Partial<SectionDraft>) {
    setSections(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    create.mutate({
      name: form.get("name"),
      city: form.get("city"),
      address: form.get("address"),
      sections,
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium sm:col-span-2">
          Venue name
          <input name="name" required maxLength={255} className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          City
          <input name="city" required maxLength={255} className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Address
          <input name="address" required maxLength={500} className={inputClass} />
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Seating sections</legend>
        <p className="text-xs text-zinc-500">
          Rows are lettered A, B, C… from front to back across sections. Each section can have its own price per
          showtime.
        </p>

        {sections.map((section, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_90px_110px_auto]">
            <label className="col-span-2 block text-xs font-medium sm:col-span-1">
              Name
              <input
                value={section.name}
                onChange={(e) => update(i, { name: e.target.value })}
                required
                maxLength={50}
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-medium">
              Rows
              <input
                type="number"
                min={1}
                max={MAX_ROWS}
                value={section.rows}
                onChange={(e) => update(i, { rows: Number(e.target.value) })}
                required
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-medium">
              Seats per row
              <input
                type="number"
                min={1}
                max={50}
                value={section.seats_per_row}
                onChange={(e) => update(i, { seats_per_row: Number(e.target.value) })}
                required
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={() => setSections(sections.filter((_, j) => j !== i))}
              disabled={sections.length === 1}
              className={dangerButton}
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setSections([...sections, { name: "", rows: 3, seats_per_row: 10 }])}
          disabled={sections.length >= 10}
          className={secondaryButton}
        >
          Add section
        </button>

        <p className={totalRows > MAX_ROWS ? "text-sm text-red-600" : "text-sm text-zinc-600"}>
          {totalSeats} seats in {totalRows} rows
          {totalRows > MAX_ROWS && ` (at most ${MAX_ROWS} rows in total)`}
        </p>
      </fieldset>

      <ErrorBox error={create.error} />

      <button type="submit" disabled={create.isPending || totalRows > MAX_ROWS} className={primaryButton}>
        {create.isPending ? "Creating…" : "Create venue"}
      </button>
    </form>
  );
}
