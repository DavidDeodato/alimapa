import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Usuário gestor sem município associado", 500)

  const requests = await prisma.request.findMany({
    where: { municipalityId },
    include: { institution: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return ok({
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
  })
}


