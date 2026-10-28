import Link from "next/link";
import { requireRole } from "@/lib/guards";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requireRole("organizer", "/organizer");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 border-b border-zinc-200 pb-2 text-sm font-medium">
        <Link href="/organizer" className="rounded-md px-3 py-1.5 hover:bg-zinc-100">
          My events
        </Link>
        <Link href="/organizer/venues" className="rounded-md px-3 py-1.5 hover:bg-zinc-100">
          Venues
        </Link>
      </div>
      {children}
    </div>
  );
}
