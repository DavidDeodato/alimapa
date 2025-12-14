import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { UserRole } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { role } = (await request.json()) as { role: UserRole }

    if (!role || !["GESTOR", "INSTITUICAO", "AGRICULTOR", "EMPRESA"].includes(role)) {
      return NextResponse.json({ ok: false, error: "Role inválido" }, { status: 400 })
    }

    // Generate demo user ID
    const userId = `demo-${role.toLowerCase()}-${Date.now()}`

    const cookieStore = await cookies()
    cookieStore.set("alimapa_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    cookieStore.set("alimapa_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ ok: true, role, userId })
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Erro ao criar sessão" }, { status: 500 })
  }
}
