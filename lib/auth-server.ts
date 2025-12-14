import { cookies } from "next/headers"
import type { UserRole } from "@/lib/types"
import { prisma } from "@/lib/db"

export type DemoSessionUser = {
  role: UserRole
  userId: string
}

export async function getDemoSessionUser(): Promise<DemoSessionUser | null> {
  const cookieStore = await cookies()
  const role = cookieStore.get("alimapa_role")?.value as UserRole | undefined
  const userId = cookieStore.get("alimapa_user_id")?.value
  if (!role || !userId) return null
  return { role, userId }
}

export async function requireRole(role: UserRole) {
  const session = await getDemoSessionUser()
  if (!session) return { ok: false as const, error: "Sessão não encontrada" }
  if (session.role !== role) return { ok: false as const, error: "Acesso negado" }

  // Enforce that cookie userId is a real DB user (demo seeded)
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return { ok: false as const, error: "Usuário da sessão não existe no banco" }

  return { ok: true as const, session, user }
}


