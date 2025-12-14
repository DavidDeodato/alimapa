import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Proposta inválida.", 400)

  const auth = await requireRole("AGRICULTOR")
  if (!auth.ok) return err(auth.error, 401)

  const farmer = await prisma.farmer.findFirst({ where: { userId: auth.user.id } })
  if (!farmer) return err("Agricultor não encontrado para este usuário", 404)

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      items: true,
      request: { include: { institution: true } },
    },
  })
  if (!offer) return err("Proposta não encontrada.", 404)
  if (offer.farmerId !== farmer.id) return err("Acesso negado.", 403)

  return ok({
    offer: {
      id: offer.id,
      requestId: offer.requestId,
      farmerId: offer.farmerId,
      farmerName: farmer.name,
      status: offer.status,
      items: offer.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit,
      })),
      proposedValue: offer.proposedValue ?? undefined,
      marketValue: offer.marketValue ?? undefined,
      distance: offer.distanceKm ?? undefined,
      createdAt: offer.createdAt.toISOString(),
      needByDate: offer.request.needByDate.toISOString(),
      institutionName: offer.request.institution.name,
      address: offer.request.address ?? undefined,
      program: offer.request.program,
      requestStatus: offer.request.status,
    },
  })
}


