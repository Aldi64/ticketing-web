"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authRequest } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await authRequest("logout");
    } finally {
      router.push("/");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={pending}
      className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
    >
      Log out
    </button>
  );
}
