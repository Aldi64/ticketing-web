"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";
import { api } from "@/lib/client";
import { ErrorBox } from "../error-box";

const MAX_BYTES = 2 * 1024 * 1024;

export function PosterUpload({ eventId, posterUrl }: { eventId: number; posterUrl: string | null }) {
  const router = useRouter();
  const [tooBig, setTooBig] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("poster", file);

      return api(`/organizer/events/${eventId}/poster`, { method: "POST", body });
    },
    onSuccess: () => router.refresh(),
  });

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setTooBig(file.size > MAX_BYTES);
    if (file.size <= MAX_BYTES) upload.mutate(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500">
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="Event poster" className="h-full w-full object-cover" />
        )}
      </div>

      <label className="block cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-center text-sm font-medium hover:bg-zinc-50">
        {upload.isPending ? "Uploading…" : posterUrl ? "Replace poster" : "Upload poster"}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} className="sr-only" />
      </label>
      <p className="text-xs text-zinc-500">JPG, PNG or WebP, up to 2 MB.</p>
      {tooBig && <p className="text-sm text-red-600">That file is larger than 2 MB.</p>}
      <ErrorBox error={upload.error} />
    </div>
  );
}
