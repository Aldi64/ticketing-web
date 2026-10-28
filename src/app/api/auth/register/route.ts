import { forwardAuth } from "@/lib/auth-route";

export const POST = (request: Request) => forwardAuth(request, "register");
