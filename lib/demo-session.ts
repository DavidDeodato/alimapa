import { cookies } from "next/headers"
import type { DemoSession, UserRole } from "./types"

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies()
  const role = cookieStore.get("alimapa_role")?.value as UserRole
  const userId = cookieStore.get("alimapa_user_id")?.value

  if (!role || !userId) {
    return null
  }

  return { role, userId }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    GESTOR: "Gestor Municipal",
    INSTITUICAO: "Instituição",
    AGRICULTOR: "Agricultor Familiar",
    EMPRESA: "Empresa",
  }
  return labels[role]
}

export function getRoleHomePath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    GESTOR: "/m/painel",
    INSTITUICAO: "/i/requisicoes",
    AGRICULTOR: "/f/propostas",
    EMPRESA: "/c/marketplace",
  }
  return paths[role]
}
