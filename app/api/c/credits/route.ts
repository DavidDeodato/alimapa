import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("EMPRESA")
  if (!auth.ok) return err(auth.error, 401)

  const company = await prisma.company.findFirst({ where: { userId: auth.user.id } })
  if (!company) return err("Empresa não encontrada para este usuário.", 404)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Empresa sem município associado.", 400)

  const credits = await prisma.impactCredit.findMany({
    where: {
      municipalityId,
      status: "DISPONIVEL",
      listedAt: { not: null },
    },
    include: {
      request: { include: { institution: true } },
      offer: true,
      farmer: true,
    },
    orderBy: { listedAt: "desc" },
    take: 200,
  })

  return ok({
    credits: credits.map((c) => ({
      id: c.id,
      farmerId: c.farmerId,
      farmerName: c.farmer?.name ?? "Agricultor",
      offerId: c.offerId,
      requestId: c.requestId,
      institutionId: c.institutionId,
      institutionName: c.request.institution.name,
      monetaryValue: c.monetaryValue,
      impactCredits: c.impactCredits,
      unitType: c.unitType,
      status: c.status,
      program: c.program,
      backing: c.backing,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
}


