import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Proposta inválida.", 400)

  const auth = await requireRole("AGRICULTOR")
  if (!auth.ok) return err(auth.error, 401)

  const farmer = await prisma.farmer.findFirst({ where: { userId: auth.user.id } })
  if (!farmer) return err("Agricultor não encontrado para este usuário", 404)

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: { request: true },
  })
  if (!offer) return err("Proposta não encontrada.", 404)
  if (offer.farmerId !== farmer.id) return err("Acesso negado.", 403)
  if (offer.status !== "SENT") return err("Apenas propostas enviadas podem ser aceitas.", 400)

  const updated = await prisma.offer.update({
    where: { id },
    data: { status: "ACCEPTED" },
  })

  // request entra em execução
  if (offer.request.status !== "FULFILLING") {
    await prisma.request.update({
      where: { id: offer.requestId },
      data: { status: "FULFILLING" },
    })
  }

  await auditLog({
    actorUserId: auth.user.id,
    action: "offer.accepted",
    entityType: "Offer",
    entityId: updated.id,
    details: { requestId: offer.requestId, farmerId: farmer.id },
  })

  return ok({ offerId: updated.id, status: updated.status })
}


