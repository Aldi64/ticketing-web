import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/server-api";

export const metadata: Metadata = { title: "Sign up" };

/** Only same-site paths are allowed, so a crafted link can't send people to another site after login. */
const safeNext = (value: string | undefined) => (value && /^\/(?![\/\\])/.test(value) ? value : "/");

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser()) redirect(next);

  return <AuthForm mode="register" next={next} />;
}
