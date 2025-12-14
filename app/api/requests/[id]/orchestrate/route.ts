import { ok, err } from "@/lib/api-response"
import { requireRole } from "@/lib/auth-server"
import { orchestrateRequest } from "@/lib/orchestrator"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  try {
    const result = await orchestrateRequest({ requestId: params.id, startedByUserId: auth.user.id })
    return ok(result)
  } catch (e: any) {
    return err(e?.message || "Falha ao orquestrar", 400)
  }
}


