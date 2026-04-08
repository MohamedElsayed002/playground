import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "chat_access";
/** Login/register only — redirect to app if already signed in. */
const AUTH_LANDING_PAGES = new Set(["/auth/login", "/auth/register"]);
const PRIVATE_PREFIXES = ["/chat", "/rooms"];
const DEFAULT_PRIVATE_REDIRECT = "/";
const DEFAULT_PUBLIC_REDIRECT = "/auth/login";

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isPrivatePath(pathname: string) {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const pathname = normalizePath(request.nextUrl.pathname);
  const isLoggedIn = Boolean(request.cookies.get(ACCESS_COOKIE)?.value);

  if (AUTH_LANDING_PAGES.has(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_PRIVATE_REDIRECT, request.url));
  }

  if (isPrivatePath(pathname) && !isLoggedIn) {
    const loginUrl = new URL(DEFAULT_PUBLIC_REDIRECT, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// `/auth/oauth/google` is matched so middleware runs consistently; do not add it to
// AUTH_LANDING_PAGES — the hash `#data=...` is client-only and must not be lost to a redirect.
export const config = {
  matcher: [
    "/auth/login",
    "/auth/register",
    "/auth/oauth/google",
    "/chat/:path*",
    "/rooms/:path*",
  ],
};
