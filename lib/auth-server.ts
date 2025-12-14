import type { UserRole } from "@/lib/types"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function requireRole(role: UserRole) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { ok: false as const, error: "Não autenticado" }
  const sessionRole = (session.user as any).role as UserRole | undefined
  const userId = (session.user as any).id as string | undefined
  if (!sessionRole || !userId) return { ok: false as const, error: "Sessão inválida" }
  if (sessionRole !== role) return { ok: false as const, error: "Acesso negado" }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { ok: false as const, error: "Usuário não encontrado" }

  return { ok: true as const, session: { role: sessionRole, userId }, user }
}


