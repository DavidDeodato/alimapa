import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Crédito inválido", 400)
  const auth = await requireRole("AGRICULTOR")
  if (!auth.ok) return err(auth.error, 401)

  const farmer = await prisma.farmer.findFirst({ where: { userId: auth.user.id } })
  if (!farmer) return err("Agricultor não encontrado para este usuário", 404)

  const credit = await prisma.impactCredit.findUnique({ where: { id } })
  if (!credit) return err("Crédito não encontrado", 404)
  if (credit.farmerId !== farmer.id) return err("Você não tem permissão para alterar este crédito", 403)

  const updated = await prisma.impactCredit.update({
    where: { id: credit.id },
    data: { listedAt: new Date(), status: credit.status === "VENDIDO" ? "VENDIDO" : "DISPONIVEL" },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: auth.user.id,
      action: "credit.listed",
      entityType: "ImpactCredit",
      entityId: updated.id,
    },
  })

  return ok({ creditId: updated.id, status: updated.status })
}



