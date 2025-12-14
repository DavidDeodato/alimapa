import { cookies } from "next/headers"
import type { UserRole } from "@/lib/types"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { role } = (await request.json()) as { role: UserRole }

    if (!role || !["GESTOR", "INSTITUICAO", "AGRICULTOR", "EMPRESA"].includes(role)) {
      return err("Role inválido", 400)
    }

    const user = await prisma.user.findFirst({
      where: { role },
      orderBy: { createdAt: "asc" },
    })
    if (!user) return err("Usuário de demonstração não encontrado no banco. Rode o seed.", 500)

    const cookieStore = await cookies()
    cookieStore.set("alimapa_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    cookieStore.set("alimapa_user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    })

    return ok({ role, userId: user.id })
  } catch (error) {
    return err("Erro ao criar sessão", 500)
  }
}
