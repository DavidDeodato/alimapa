import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { auditLog } from "@/lib/audit"

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const requestId = id

  const req = await prisma.request.findUnique({ where: { id: requestId } })
  if (!req) return err("Requisição não encontrada", 404)

  if (req.status !== "SUBMITTED") return err("Apenas requisições enviadas podem ser validadas", 400)

  await prisma.request.update({
    where: { id: requestId },
    data: { status: "VALIDATED" },
  })

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.validated",
    entityType: "Request",
    entityId: requestId,
  })

  return ok({ requestId, status: "VALIDATED" })
}


