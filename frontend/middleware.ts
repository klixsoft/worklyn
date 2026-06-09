import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/session";


export async function middleware(request: NextRequest) {
  /**
   * Intercepts requests to enforce user authentication across protected dashboard routes.
   */
  const res = NextResponse.next();
  const session = await getIronSession<{ user?: any }>(request, res, sessionOptions);
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/attendance") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/hr") ||
    pathname.startsWith("/users") ||
    pathname.startsWith("/roles") ||
    pathname.startsWith("/updates") ||
    pathname.startsWith("/notifications");

  if (isProtectedRoute && !session.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && session.user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
