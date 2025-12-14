import { ok, err } from "@/lib/api-response"
import { requireRole } from "@/lib/auth-server"
import { analyzeRequest } from "@/lib/orchestrator"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  // opcional: permitir passar agentConfigId no futuro para calcular valores; por enquanto é só ranking.
  void req

  try {
    const result = await analyzeRequest({ requestId: id })
    return ok(result)
  } catch (e: any) {
    return err(e?.message || "Falha ao analisar", 400)
  }
}



