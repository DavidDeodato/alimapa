import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Usuário gestor sem município associado", 500)

  const municipality = await prisma.municipality.findUnique({ where: { id: municipalityId } })
  if (!municipality) return err("Município não encontrado", 500)

  const [requests, farmers] = await Promise.all([
    prisma.request.findMany({
      where: { municipalityId },
      include: { institution: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.farmer.findMany({
      where: { municipalityId },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ])

  const counts = {
    pendingValidation: requests.filter((r) => r.status === "SUBMITTED").length,
    orchestrating: requests.filter((r) => r.status === "ORCHESTRATING").length,
    fulfilling: requests.filter((r) => r.status === "FULFILLING").length,
    closed: requests.filter((r) => r.status === "CLOSED").length,
    activeFarmers: farmers.length,
    centerLat: municipality.centerLat ?? -15.78,
    centerLng: municipality.centerLng ?? -47.93,
  }

  const data = {
    dashboard: counts,
    requests: requests.map((r) => ({
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
    })),
    farmers: farmers.map((f) => ({
      id: f.id,
      name: f.name,
      products: f.products,
      capacity: f.capacity ?? undefined,
      cafStatus: f.cafStatus,
      lat: f.lat ?? undefined,
      lng: f.lng ?? undefined,
      address: f.address ?? undefined,
      phone: f.phone ?? undefined,
    })),
  }

  return ok(data)
}


