import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("AGRICULTOR")
  if (!auth.ok) return err(auth.error, 401)

  const farmer = await prisma.farmer.findFirst({ where: { userId: auth.user.id } })
  if (!farmer) return err("Agricultor não encontrado para este usuário", 404)

  const credits = await prisma.impactCredit.findMany({
    where: { farmerId: farmer.id },
    include: { request: { include: { institution: true } }, offer: true, municipality: true, purchasedByCompany: true },
    orderBy: { createdAt: "desc" },
  })

  const data = credits.map((c) => ({
    id: c.id,
    farmerId: farmer.id,
    farmerName: farmer.name,
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
    purchasedBy: c.purchasedByCompany?.name ?? undefined,
    purchasedAt: c.purchasedAt ? c.purchasedAt.toISOString() : undefined,
  }))

  return ok({ credits: data })
}


