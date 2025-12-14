import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida", 400)
  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.institutionId !== institution.id) return err("Acesso negado", 403)

  return ok({
    request: {
      id: r.id,
      institutionId: r.institutionId,
      institutionName: institution.name,
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
  })
}



