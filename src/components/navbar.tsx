import Link from "next/link";
import type { User } from "@/lib/types";
import { LogoutButton } from "./logout-button";

const linkClass = "rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100";

export function Navbar({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-2 sm:px-6">
        <Link href="/" className="mr-3 text-lg font-bold tracking-tight text-indigo-600">
          Ticketing
        </Link>

        <Link href="/" className={linkClass}>
          Events
        </Link>
        {user && (
          <Link href="/orders" className={linkClass}>
            My orders
          </Link>
        )}
        {user?.role === "organizer" && (
          <Link href="/organizer" className={linkClass}>
            Organizer
          </Link>
        )}
        {user?.role === "admin" && (
          <Link href="/admin" className={linkClass}>
            Admin
          </Link>
        )}

        <div className="ml-auto flex items-center gap-1">
          {user ? (
            <>
              <span className="hidden px-2 text-sm text-zinc-500 sm:inline">{user.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
