"use client";

import { useEffect, useState } from "react";

/**
 * Seconds left until `deadline` (ISO string), ticking every second.
 * `offsetMs` is serverTime - clientTime, so a wrong clock on the visitor's device doesn't matter.
 */
export function useCountdown(deadline: string | null, offsetMs = 0): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  return Math.max(0, Math.ceil((new Date(deadline).getTime() - (now + offsetMs)) / 1000));
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
