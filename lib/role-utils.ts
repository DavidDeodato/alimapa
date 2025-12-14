import type { UserRole } from "@/lib/types"

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


