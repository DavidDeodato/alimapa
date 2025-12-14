import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const roleHome: Record<string, string> = {
  GESTOR: "/m/painel",
  INSTITUICAO: "/i/nova-requisicao",
  AGRICULTOR: "/f/propostas",
  EMPRESA: "/c/marketplace",
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Público
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/alimap.png")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-alimapa" })
  const isAuthed = !!token?.sub
  const role = (token as any)?.role as string | undefined

  // raiz: manda pro home do papel
  if (pathname === "/") {
    if (!isAuthed) return NextResponse.redirect(new URL("/auth/login", request.url))
    const dest = (role && roleHome[role]) || "/auth/login"
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // áreas protegidas por role (páginas)
  const needsRole =
    (pathname.startsWith("/m") && "GESTOR") ||
    (pathname.startsWith("/i") && "INSTITUICAO") ||
    (pathname.startsWith("/f") && "AGRICULTOR") ||
    (pathname.startsWith("/c") && "EMPRESA") ||
    null

  if (!needsRole) return NextResponse.next()

  if (!isAuthed) {
    const url = new URL("/auth/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (role !== needsRole) {
    const dest = (role && roleHome[role]) || "/auth/login"
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
