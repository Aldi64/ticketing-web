import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./server-api";
import type { Role, User } from "./types";

/**
 * Page-level guard: guests go to login, and users with another role go home.
 * This only hides pages. The API enforces the role again on every request.
 */
export async function requireRole(role: Role, returnTo: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (user.role !== role) redirect("/");

  return user;
}
