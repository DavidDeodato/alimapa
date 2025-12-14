import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

const UpsertSchema = z.object({
  farmerId: z.string().optional().nullable(), // "__DEFAULT__" ou null => default municipal
  type: z.enum(["NEGOTIATOR", "VALIDATOR"]).optional().default("NEGOTIATOR"),
  personality: z.string().min(2),
  objectives: z.array(z.string().min(1)).default([]),
  offerCalculation: z.enum(["FIXED_PER_PRODUCT", "CUSTOM_PER_FARMER"]),
  fixedDiscounts: z.record(z.number()).optional(),
  customFormula: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  validatorConfig: z.any().optional(),
  isActive: z.boolean().optional().default(true),
})

export async function GET() {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const configs = await prisma.agentConfig.findMany({
    where: { municipalityId },
    include: { farmer: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return ok({
    agents: configs.map((c) => ({
      id: c.id,
      farmerId: c.farmerId ?? "__DEFAULT__",
      farmerName: c.farmerName ?? c.farmer?.name ?? "Padrão do município",
      type: c.type as any,
      personality: c.personality,
      objectives: c.objectives,
      offerCalculation: c.offerCalculation as any,
      fixedDiscounts: (c.fixedDiscounts as any) ?? undefined,
      customFormula: c.customFormula ?? undefined,
      instructions: c.instructions ?? undefined,
      validatorConfig: (c.validatorConfig as any) ?? undefined,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
}

export async function POST(req: Request) {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return err("Payload inválido.", 400)

  const rawFarmerId = parsed.data.farmerId
  const farmerId = !rawFarmerId || rawFarmerId === "__DEFAULT__" ? null : rawFarmerId
  const type = parsed.data.type ?? "NEGOTIATOR"

  let farmerName: string | null = null
  if (farmerId) {
    const farmer = await prisma.farmer.findUnique({ where: { id: farmerId } })
    if (!farmer) return err("Agricultor não encontrado.", 404)
    if (farmer.municipalityId !== municipalityId) return err("Acesso negado.", 403)
    farmerName = farmer.name
  }

  // Se já existe config para esse farmer (ou default), atualiza; senão cria
  const existing = await prisma.agentConfig.findFirst({
    where: { municipalityId, farmerId: farmerId ?? null, type },
  })

  const saved = existing
    ? await prisma.agentConfig.update({
        where: { id: existing.id },
        data: {
          farmerName,
          type,
          personality: parsed.data.personality,
          objectives: parsed.data.objectives,
          offerCalculation: parsed.data.offerCalculation,
          fixedDiscounts: parsed.data.fixedDiscounts ?? undefined,
          customFormula: parsed.data.customFormula ?? null,
          instructions: parsed.data.instructions ?? null,
          validatorConfig: parsed.data.validatorConfig ?? null,
          isActive: parsed.data.isActive,
        },
      })
    : await prisma.agentConfig.create({
        data: {
          municipalityId,
          farmerId,
          farmerName,
          type,
          personality: parsed.data.personality,
          objectives: parsed.data.objectives,
          offerCalculation: parsed.data.offerCalculation,
          fixedDiscounts: parsed.data.fixedDiscounts ?? undefined,
          customFormula: parsed.data.customFormula ?? null,
          instructions: parsed.data.instructions ?? null,
          validatorConfig: parsed.data.validatorConfig ?? null,
          isActive: parsed.data.isActive,
        },
      })

  await auditLog({
    actorUserId: auth.user.id,
    action: "agent_config.upserted",
    entityType: "AgentConfig",
    entityId: saved.id,
    details: { farmerId: farmerId ?? null, type },
  })

  return ok({
    agent: {
      id: saved.id,
      farmerId: saved.farmerId ?? "__DEFAULT__",
      farmerName: saved.farmerName ?? "Padrão do município",
      type: saved.type as any,
      personality: saved.personality,
      objectives: saved.objectives,
      offerCalculation: saved.offerCalculation as any,
      fixedDiscounts: (saved.fixedDiscounts as any) ?? undefined,
      customFormula: saved.customFormula ?? undefined,
      instructions: saved.instructions ?? undefined,
      validatorConfig: (saved.validatorConfig as any) ?? undefined,
      isActive: saved.isActive,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    },
  })
}



