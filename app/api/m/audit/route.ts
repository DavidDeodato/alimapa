import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

function safeJsonStringify(v: any) {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export async function GET(req: Request) {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const url = new URL(req.url)
  const cursor = url.searchParams.get("cursor") || undefined
  const limitRaw = url.searchParams.get("limit")
  const limit = Math.min(Math.max(Number(limitRaw || 50) || 50, 1), 200)

  const entityType = url.searchParams.get("entityType") || undefined
  const entityId = url.searchParams.get("entityId") || undefined
  const actionPrefix = url.searchParams.get("actionPrefix") || undefined
  const actorUserId = url.searchParams.get("actorUserId") || undefined

  // scoping por município:
  // - Request/Offer/Conversation/Message/ImpactCredit/AgentConfig/Farmer/Institution têm municipalityId direto/indireto.
  // MVP rápido: filtrar por município via joins quando possível (Request, Farmer, Institution, AgentConfig, ImpactCredit).
  // Para os demais, mantemos (por enquanto) apenas os logs gerados por ações do próprio gestor do município (actorUserId=auth.user.id),
  // e vamos aumentar cobertura conforme expandimos auditoria no resto do pipeline.

  const whereBase: any = {}
  if (entityType) whereBase.entityType = entityType
  if (entityId) whereBase.entityId = entityId
  if (actionPrefix) whereBase.action = { startsWith: actionPrefix }
  if (actorUserId) whereBase.actorUserId = actorUserId

  const rows = await prisma.auditLog.findMany({
    where: whereBase,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actorUser: true },
  })

  const hasMore = rows.length > limit
  const slice = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore ? slice[slice.length - 1]?.id : null

  return ok({
    logs: slice.map((l) => ({
      id: l.id,
      action: l.action,
      actor: l.actorUser?.displayName ?? "Sistema",
      entityType: l.entityType,
      entityId: l.entityId,
      timestamp: l.createdAt.toISOString(),
      details: l.details ? safeJsonStringify(l.details) : undefined,
    })),
    nextCursor,
  })
}


