import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Server Action POSTs (file uploads etc.) must stream their body straight to
  // the action. Running updateSession here recreates the request and truncates
  // large multipart bodies ("Unexpected end of form"). Auth is still enforced
  // inside the action/page via createClient + RLS, so pass these through.
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login");

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"],
};
