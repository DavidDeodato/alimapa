import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida.", 400)

  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({
    where: { id },
    include: { items: true, evidence: true },
  })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.institutionId !== institution.id) return err("Acesso negado", 403)

  if (r.status !== "DRAFT" && r.status !== "NEEDS_REVIEW") return err("Apenas rascunhos podem ser enviados.", 400)

  if (!Array.isArray(r.items) || r.items.length === 0) return err("Adicione pelo menos 1 item antes de enviar.", 400)

  const evCount = (r.evidence || []).filter((e) => e.scope === "REQUEST_PROOF" || e.scope === "REQUEST_DOCUMENT").length
  if (evCount === 0) return err("Anexe pelo menos 1 prova (foto ou documento) antes de enviar.", 400)

  const updated = await prisma.request.update({
    where: { id },
    data: { status: "SUBMITTED" },
  })

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.submitted",
    entityType: "Request",
    entityId: updated.id,
    details: { institutionId: institution.id, evidenceCount: evCount },
  })

  return ok({ requestId: updated.id, status: updated.status })
}


