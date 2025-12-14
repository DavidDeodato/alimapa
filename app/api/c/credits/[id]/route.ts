import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Crédito inválido.", 400)

  const auth = await requireRole("EMPRESA")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Empresa sem município associado.", 400)

  const company = await prisma.company.findFirst({ where: { userId: auth.user.id } })
  if (!company) return err("Empresa não encontrada para este usuário.", 404)

  const credit = await prisma.impactCredit.findUnique({
    where: { id },
    include: {
      request: { include: { institution: true } },
      farmer: true,
      purchasedByCompany: true,
    },
  })
  if (!credit) return err("Crédito não encontrado.", 404)
  if (credit.municipalityId !== municipalityId) return err("Acesso negado.", 403)

  // se foi comprado, só o comprador pode ver
  if (credit.status === "VENDIDO" && credit.purchasedByCompanyId && credit.purchasedByCompanyId !== company.id) {
    return err("Acesso negado.", 403)
  }

  return ok({
    credit: {
      id: credit.id,
      farmerId: credit.farmerId,
      farmerName: credit.farmer?.name ?? "Agricultor",
      offerId: credit.offerId,
      requestId: credit.requestId,
      institutionId: credit.institutionId,
      institutionName: credit.request.institution.name,
      monetaryValue: credit.monetaryValue,
      impactCredits: credit.impactCredits,
      unitType: credit.unitType,
      status: credit.status,
      program: credit.program,
      backing: credit.backing,
      createdAt: credit.createdAt.toISOString(),
      updatedAt: credit.updatedAt.toISOString(),
      purchasedBy: credit.purchasedByCompany?.name ?? undefined,
      purchasedAt: credit.purchasedAt ? credit.purchasedAt.toISOString() : undefined,
    },
  })
}


