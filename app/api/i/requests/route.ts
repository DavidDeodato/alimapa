import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

const CreateSchema = z.object({
  program: z.enum(["PNAE", "PAA", "OUTROS"]),
  urgency: z.number().int().min(1).max(5),
  needByDate: z.string().min(4), // ISO date string
  title: z.string().optional().nullable(),
  justification: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  items: z
    .array(
      z.object({
        productName: z.string().min(1),
        quantity: z.number().positive(),
        unit: z.string().min(1),
      }),
    )
    .min(0),
  isDraft: z.boolean().optional().default(false),
}).superRefine((val, ctx) => {
  // Permite rascunho incompleto, mas exige itens ao ENVIAR.
  if (!val.isDraft && (!Array.isArray(val.items) || val.items.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Adicione pelo menos 1 item antes de enviar.",
      path: ["items"],
    })
  }
})

export async function GET() {
  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const requests = await prisma.request.findMany({
    where: { institutionId: institution.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return ok({
    requests: requests.map((r) => ({
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
    })),
  })
}

export async function POST(req: Request) {
  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message || "Payload inválido."
    return err(msg, 400)
  }

  const needBy = new Date(parsed.data.needByDate)
  if (Number.isNaN(needBy.getTime())) return err("Prazo de entrega inválido.", 400)

  const status = parsed.data.isDraft ? "DRAFT" : "SUBMITTED"

  const created = await prisma.request.create({
    data: {
      municipalityId: institution.municipalityId,
      institutionId: institution.id,
      program: parsed.data.program,
      status,
      urgency: parsed.data.urgency,
      needByDate: needBy,
      title: parsed.data.title ?? null,
      justification: parsed.data.justification ?? null,
      address: parsed.data.address ?? null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      items: {
        create: parsed.data.items.map((it) => ({
          productName: it.productName,
          quantity: it.quantity,
          unit: it.unit,
        })),
      },
    },
    include: { items: true },
  })

  await prisma.auditLog.create({
    data: {
      actorUserId: auth.user.id,
      action: status === "DRAFT" ? "request.draft_created" : "request.submitted",
      entityType: "Request",
      entityId: created.id,
      details: { institutionId: institution.id },
    },
  })

  return ok({
    request: {
      id: created.id,
      institutionId: created.institutionId,
      institutionName: institution.name,
      program: created.program,
      status: created.status,
      urgency: created.urgency,
      needByDate: created.needByDate.toISOString(),
      items: created.items.map((it) => ({
        id: it.id,
        productName: it.productName,
        quantity: Number(it.quantity),
        unit: it.unit,
      })),
      lat: created.lat ?? undefined,
      lng: created.lng ?? undefined,
      address: created.address ?? undefined,
      justification: created.justification ?? undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
  })
}


