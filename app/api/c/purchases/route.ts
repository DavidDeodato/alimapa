import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("EMPRESA")
  if (!auth.ok) return err(auth.error, 401)

  const company = await prisma.company.findFirst({ where: { userId: auth.user.id } })
  if (!company) return err("Empresa não encontrada para este usuário.", 404)

  const purchases = await prisma.impactCredit.findMany({
    where: { purchasedByCompanyId: company.id },
    include: {
      request: { include: { institution: true } },
      farmer: true,
    },
    orderBy: { purchasedAt: "desc" },
    take: 200,
  })

  return ok({
    purchases: purchases.map((c) => ({
      id: c.id,
      creditId: c.id,
      units: c.impactCredits,
      type: c.unitType,
      purchasedAt: c.purchasedAt ? c.purchasedAt.toISOString() : c.updatedAt.toISOString(),
      status: "CONCLUIDO",
      farmerName: c.farmer?.name ?? "Agricultor",
      institutionName: c.request.institution.name,
    })),
  })
}


