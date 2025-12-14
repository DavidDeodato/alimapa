import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  const { id, evidenceId } = await params
  if (!id || !evidenceId) return err("Parâmetros inválidos.", 400)

  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({ where: { id } })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.institutionId !== institution.id) return err("Acesso negado", 403)

  const ev = await prisma.evidence.findUnique({ where: { id: evidenceId } })
  if (!ev) return err("Evidência não encontrada.", 404)
  if (ev.requestId !== id) return err("Acesso negado", 403)

  await prisma.evidence.delete({ where: { id: evidenceId } })

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.evidence_removed",
    entityType: "Request",
    entityId: id,
    details: { evidenceId, scope: ev.scope },
  })

  return ok({ deleted: true })
}


