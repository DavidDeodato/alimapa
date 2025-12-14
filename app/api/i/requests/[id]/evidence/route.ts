import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

const CreateSchema = z.object({
  scope: z.enum([
    "REQUEST_PROOF",
    "REQUEST_DOCUMENT",
    "DELIVERY_PROOF",
    "DELIVERY_DOCUMENT",
    "INSTITUTION_PHOTO",
    "FARMER_DOCUMENT",
  ]),
  url: z.string().url(),
  publicId: z.string().optional().nullable(),
  resourceType: z.enum(["image", "raw"]).optional().nullable(),
  fileType: z.string().optional().nullable(),
  originalName: z.string().optional().nullable(),
  sizeBytes: z.number().int().positive().optional().nullable(),
  kind: z.string().optional().nullable(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida.", 400)

  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({ where: { id } })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.institutionId !== institution.id) return err("Acesso negado", 403)

  const evidence = await prisma.evidence.findMany({
    where: { requestId: id },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return ok({
    evidence: evidence.map((e) => ({
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
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida.", 400)

  const auth = await requireRole("INSTITUICAO")
  if (!auth.ok) return err(auth.error, 401)

  const institution = await prisma.institution.findUnique({ where: { userId: auth.user.id } })
  if (!institution) return err("Instituição não encontrada para este usuário.", 400)

  const r = await prisma.request.findUnique({ where: { id } })
  if (!r) return err("Requisição não encontrada", 404)
  if (r.institutionId !== institution.id) return err("Acesso negado", 403)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return err("Payload inválido.", 400)

  const created = await prisma.evidence.create({
    data: {
      requestId: id,
      scope: parsed.data.scope as any,
      url: parsed.data.url,
      publicId: parsed.data.publicId ?? null,
      resourceType: parsed.data.resourceType ?? null,
      fileType: parsed.data.fileType ?? null,
      originalName: parsed.data.originalName ?? null,
      sizeBytes: parsed.data.sizeBytes ?? null,
      kind: parsed.data.kind ?? null,
      uploadedByUserId: auth.user.id,
      uploadedByRole: "INSTITUICAO",
    },
  })

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.evidence_added",
    entityType: "Request",
    entityId: id,
    details: { evidenceId: created.id, scope: created.scope },
  })

  return ok({
    evidence: {
      id: created.id,
      scope: created.scope,
      url: created.url,
      kind: created.kind ?? undefined,
      fileType: created.fileType ?? undefined,
      resourceType: created.resourceType ?? undefined,
      originalName: created.originalName ?? undefined,
      sizeBytes: created.sizeBytes ?? undefined,
      extractedText: created.extractedText ?? undefined,
      extractionStatus: created.extractionStatus,
      createdAt: created.createdAt.toISOString(),
    },
  })
}


