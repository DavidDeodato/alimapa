import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Crédito inválido.", 400)

  const auth = await requireRole("EMPRESA")
  if (!auth.ok) return err(auth.error, 401)

  const company = await prisma.company.findFirst({ where: { userId: auth.user.id } })
  if (!company) return err("Empresa não encontrada para este usuário.", 404)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Empresa sem município associado.", 400)

  const credit = await prisma.impactCredit.findUnique({ where: { id } })
  if (!credit) return err("Crédito não encontrado.", 404)
  if (credit.municipalityId !== municipalityId) return err("Acesso negado.", 403)
  if (credit.status !== "DISPONIVEL") return err("Crédito não está disponível.", 400)
  if (!credit.listedAt) return err("Crédito não está anunciado.", 400)

  const updated = await prisma.impactCredit.update({
    where: { id },
    data: {
      status: "VENDIDO",
      purchasedByCompanyId: company.id,
      purchasedAt: new Date(),
    },
  })

  await auditLog({
    actorUserId: auth.user.id,
    action: "credit.purchased",
    entityType: "ImpactCredit",
    entityId: updated.id,
    details: { companyId: company.id, farmerId: updated.farmerId, offerId: updated.offerId, requestId: updated.requestId },
  })

  return ok({ creditId: updated.id, status: updated.status })
}


