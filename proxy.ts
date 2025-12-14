import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and demo page
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/demo") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  const role = request.cookies.get("alimapa_role")?.value
  const userId = request.cookies.get("alimapa_user_id")?.value

  // Redirect to demo if no session
  if (!role || !userId) {
    return NextResponse.redirect(new URL("/demo", request.url))
  }

  // Check role-based access
  const rolePrefix = pathname.split("/")[1]
  const allowedPrefixes: Record<string, string> = {
    GESTOR: "m",
    INSTITUICAO: "i",
    AGRICULTOR: "f",
    EMPRESA: "c",
  }

  if (allowedPrefixes[role] !== rolePrefix) {
    return NextResponse.redirect(new URL("/demo", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
