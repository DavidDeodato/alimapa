import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Agente inválido.", 400)
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const existing = await prisma.agentConfig.findUnique({ where: { id } })
  if (!existing) return err("Configuração não encontrada.", 404)
  if (existing.municipalityId !== municipalityId) return err("Acesso negado.", 403)

  const updated = await prisma.agentConfig.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  await auditLog({
    actorUserId: auth.user.id,
    action: updated.isActive ? "agent_config.resumed" : "agent_config.paused",
    entityType: "AgentConfig",
    entityId: updated.id,
  })

  return ok({ id: updated.id, isActive: updated.isActive })
}



