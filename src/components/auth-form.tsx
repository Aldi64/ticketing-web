"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api-error";
import { authRequest } from "@/lib/client";

type Mode = "login" | "register";

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export function AuthForm({ mode, next = "/" }: { mode: Mode; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const body: Record<string, FormDataEntryValue> = Object.fromEntries(form);

    try {
      await authRequest(mode, body);
      router.push(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(500, { message: "Something went wrong." }));
      setPending(false);
    }
  }

  const fieldError = (name: string) =>
    error?.field(name) && <p className="mt-1 text-xs text-red-600">{error.field(name)}</p>;

  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{mode === "login" ? "Log in" : "Create your account"}</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        {mode === "register" && (
          <label className="block text-sm font-medium">
            Name
            <input name="name" required autoComplete="name" className={inputClass} />
            {fieldError("name")}
          </label>
        )}

        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
          {fieldError("email")}
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={inputClass}
          />
          {fieldError("password")}
        </label>

        {mode === "register" && (
          <>
            <label className="block text-sm font-medium">
              I want to
              <select name="role" defaultValue="attendee" className={inputClass}>
                <option value="attendee">Buy tickets</option>
                <option value="organizer">Sell tickets for my events</option>
              </select>
              {fieldError("role")}
            </label>
          </>
        )}

        {error && !error.body.errors && <p className="text-sm text-red-600">{error.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-600">
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href={next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600 hover:underline">
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already registered?{" "}
            <Link href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="font-medium text-indigo-600 hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
