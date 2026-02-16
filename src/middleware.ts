import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = new Set(["/login"]);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isAuthRoute = pathname.startsWith("/api/v1/auth") || pathname.startsWith("/api/auth");
  const isNextAsset =
    pathname.startsWith("/_next") || pathname.startsWith("/images") || pathname === "/favicon.ico";
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isLoggedIn = Boolean(req.auth?.user);

  if (isAuthRoute || isNextAsset) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
