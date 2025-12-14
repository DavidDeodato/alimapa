import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida", 400)
  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({
    where: { id },
    include: { items: true, evidence: true },
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
      evidence: (r.evidence || []).map((e) => ({
        id: e.id,
        scope: e.scope,
        url: e.url,
        kind: e.kind ?? undefined,
        fileType: e.fileType ?? undefined,
        resourceType: e.resourceType ?? undefined,
        originalName: e.originalName ?? undefined,
        sizeBytes: e.sizeBytes ?? undefined,
        extractedText: e.extractedText ?? undefined,
        extractionStatus: e.extractionStatus,
        createdAt: e.createdAt.toISOString(),
      })),
    },
  })
}

const UpdateDraftSchema = z.object({
  program: z.enum(["PNAE", "PAA", "OUTROS"]),
  urgency: z.number().int().min(1).max(5),
  needByDate: z.string().min(4),
  title: z.string().optional().nullable(),
  justification: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  items: z.array(
    z.object({
      productName: z.string().min(1),
      quantity: z.number().positive(),
      unit: z.string().min(1),
    }),
  ),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida", 400)

  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const existing = await prisma.request.findUnique({ where: { id }, include: { items: true } })
  if (!existing) return err("Requisição não encontrada", 404)
  if (existing.institutionId !== institution.id) return err("Acesso negado", 403)
  if (existing.status !== "DRAFT" && existing.status !== "NEEDS_REVIEW") return err("Apenas rascunhos podem ser editados.", 400)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = UpdateDraftSchema.safeParse(body)
  if (!parsed.success) return err(parsed.error.issues?.[0]?.message || "Payload inválido.", 400)

  const needBy = new Date(parsed.data.needByDate)
  if (Number.isNaN(needBy.getTime())) return err("Prazo de entrega inválido.", 400)

  await prisma.$transaction([
    prisma.requestItem.deleteMany({ where: { requestId: id } }),
    prisma.request.update({
      where: { id },
      data: {
        program: parsed.data.program,
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
    }),
  ])

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.draft_updated",
    entityType: "Request",
    entityId: id,
    details: { institutionId: institution.id },
  })

  return ok({ updated: true })
}



