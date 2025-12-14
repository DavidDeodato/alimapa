import { ok, err } from "@/lib/api-response"
import { requireRole } from "@/lib/auth-server"
import { orchestrateRequest } from "@/lib/orchestrator"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  let body: any = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  const agentConfigId = typeof body?.agentConfigId === "string" && body.agentConfigId.trim() ? body.agentConfigId.trim() : undefined
  const farmerIds = Array.isArray(body?.farmerIds) ? body.farmerIds.filter((x: any) => typeof x === "string" && x) : undefined

  try {
    const result = await orchestrateRequest({ requestId: id, startedByUserId: auth.user.id, agentConfigId, farmerIds })
    return ok(result)
  } catch (e: any) {
    return err(e?.message || "Falha ao orquestrar", 400)
  }
}


