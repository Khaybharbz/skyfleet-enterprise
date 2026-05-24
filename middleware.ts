import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(
    "skyfleet_token"
  )?.value;

  const path = req.nextUrl.pathname;

  /**
   * PUBLIC ROUTES
   */
  if (path === "/" || path === "/login") {
    return NextResponse.next();
  }

  /**
   * NO TOKEN → BLOCK
   */
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  const user = await verifyToken(token);

  if (!user) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  /**
   * ADMIN ROUTE PROTECTION
   */
  if (path.startsWith("/admin")) {
    if (user.role !== "admin") {
      return NextResponse.redirect(
        new URL("/dashboard", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};