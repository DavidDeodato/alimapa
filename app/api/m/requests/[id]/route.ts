import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Usuário gestor sem município associado", 500)

  const r = await prisma.request.findUnique({
    where: { id: params.id },
    include: { institution: true, items: true, offers: { include: { farmer: true, items: true } } },
  })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.municipalityId !== municipalityId) return err("Acesso negado", 403)

  return ok({
    request: {
      id: r.id,
      institutionId: r.institutionId,
      institutionName: r.institution.name,
      program: r.program,
      status: r.status,
      urgency: r.urgency,
      needByDate: r.needByDate.toISOString(),
      items: r.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit,
      })),
      lat: r.lat ?? undefined,
      lng: r.lng ?? undefined,
      address: r.address ?? undefined,
      justification: r.justification ?? undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    },
    offers: r.offers.map((o) => ({
      id: o.id,
      requestId: o.requestId,
      farmerId: o.farmerId,
      farmerName: o.farmer.name,
      status: o.status,
      items: o.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit,
      })),
      proposedValue: o.proposedValue ?? undefined,
      marketValue: o.marketValue ?? undefined,
      distance: o.distanceKm ?? undefined,
      createdAt: o.createdAt.toISOString(),
    })),
  })
}


