import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { geminiGenerateText } from "@/lib/gemini"
import { auditLog } from "@/lib/audit"

const BodySchema = z.object({
  agentConfigId: z.string().min(1),
})

const AnalysisSchema = z.object({
  verdict: z.enum(["APPROVE", "REVIEW", "REJECT"]),
  confidence: z.number().min(0).max(1),
  checklist: z
    .array(
      z.object({
        item: z.string().min(1),
        status: z.enum(["PASS", "FAIL", "MISSING"]),
        reason: z.string().optional().default(""),
      }),
    )
    .default([]),
  missing: z.array(z.string()).optional().default([]),
  issues: z.array(z.string()).optional().default([]),
  notes: z.string().optional().default(""),
})

function extractJsonObject(text: string): string | null {
  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) return null
  return text.slice(first, last + 1)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Requisição inválida.", 400)

  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return err("Payload inválido.", 400)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const request = await prisma.request.findUnique({
    where: { id },
    include: { institution: true, items: true, evidence: true },
  })
  if (!request) return err("Requisição não encontrada", 404)
  if (request.municipalityId !== municipalityId) return err("Acesso negado", 403)

  const agent = await prisma.agentConfig.findUnique({ where: { id: parsed.data.agentConfigId } })
  if (!agent) return err("Agente não encontrado.", 404)
  if (agent.municipalityId !== municipalityId) return err("Acesso negado.", 403)
  if (!agent.isActive) return err("Agente inativo.", 400)
  if (agent.type !== "VALIDATOR") return err("Agente precisa ser do tipo VALIDATOR.", 400)

  const checklist: string[] = Array.isArray((agent.validatorConfig as any)?.checklist)
    ? (agent.validatorConfig as any).checklist.map((x: any) => String(x)).filter(Boolean)
    : [
        "Foto externa do local",
        "Foto interna do local",
        "Documento de identificação da instituição",
      ]

  const evidence = (request.evidence || []).map((e) => ({
    id: e.id,
    scope: e.scope,
    originalName: e.originalName,
    fileType: e.fileType,
    resourceType: e.resourceType,
    url: e.url,
    extractedText: e.extractedText,
    createdAt: e.createdAt.toISOString(),
  }))

  const system = [
    "Você é um agente VALIDADOR do Alimapa.",
    "Seu trabalho: analisar provas (fotos/documentos) anexadas a uma requisição e preencher um checklist, apontando faltas e inconsistências.",
    "Responda SOMENTE com JSON válido, sem markdown.",
    "Use o schema exato:",
    JSON.stringify(
      {
        verdict: "APPROVE|REVIEW|REJECT",
        confidence: 0.0,
        checklist: [{ item: "string", status: "PASS|FAIL|MISSING", reason: "string" }],
        missing: ["string"],
        issues: ["string"],
        notes: "string",
      },
      null,
      2,
    ),
  ].join("\n")

  const user = [
    `Requisição ${request.id} (${request.program})`,
    `Instituição: ${request.institution.name}`,
    `Prazo: ${request.needByDate.toISOString().slice(0, 10)}`,
    `Endereço: ${request.address ?? "-"}`,
    "",
    "Checklist a preencher (use exatamente esses itens):",
    ...checklist.map((c) => `- ${c}`),
    "",
    "Evidências anexadas:",
    evidence.length ? JSON.stringify(evidence, null, 2) : "[]",
    "",
    "Regras:",
    "- Se faltar evidência para um item do checklist, marque MISSING.",
    "- Se existir evidência mas houver inconsistência (ex.: documento ilegível), marque FAIL e explique.",
    "- Se estiver ok, marque PASS.",
  ].join("\n")

  let analysisRaw: string
  try {
    analysisRaw = await geminiGenerateText({ system, user })
  } catch (e: any) {
    return err(e?.message || "Falha ao chamar Gemini", 400)
  }

  const jsonText = extractJsonObject(analysisRaw)
  if (!jsonText) return err("IA retornou resposta inválida (sem JSON).", 400)

  let analysisObj: any
  try {
    analysisObj = JSON.parse(jsonText)
  } catch {
    return err("IA retornou JSON inválido.", 400)
  }

  const validated = AnalysisSchema.safeParse(analysisObj)
  if (!validated.success) return err("IA retornou JSON fora do schema esperado.", 400)

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.proofs_analyzed",
    entityType: "Request",
    entityId: request.id,
    details: { agentConfigId: agent.id, verdict: validated.data.verdict, confidence: validated.data.confidence },
  })

  return ok({ analysis: validated.data })
}


