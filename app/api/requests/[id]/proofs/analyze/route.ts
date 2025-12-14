import { z } from "zod"
import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"
import { geminiGenerateTextWithOptions } from "@/lib/gemini"
import { auditLog } from "@/lib/audit"

const BodySchema = z.object({
  agentConfigId: z.string().min(1),
})

const AnalysisSchema = z.object({
  verdict: z.enum(["APPROVE", "REVIEW", "REJECT"]),
  confidence: z.number().min(0).max(1),
  checklist: z.array(
    z.object({
      item: z.string().min(1),
      status: z.enum(["PASS", "FAIL", "MISSING"]),
      reason: z.string().optional().default(""),
    }),
  ),
  missing: z.array(z.string()).default([]),
})

function extractJsonObject(text: string): string | null {
  const first = text.indexOf("{")
  const last = text.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) return null
  return text.slice(first, last + 1)
}

function fallbackAnalysis(checklist: string[], evidenceCount: number, reason: string) {
  const items = checklist.map((item) => ({ item, status: "MISSING" as const, reason: "Não foi possível validar automaticamente." }))
  return {
    fallback: true,
    verdict: evidenceCount > 0 ? ("REVIEW" as const) : ("REJECT" as const),
    confidence: 0.25,
    checklist: items,
    missing: checklist,
    // nota interna apenas para auditoria (não exibimos no schema público)
    _internalReason: reason,
  }
}

async function callValidatorLLM(params: { system: string; user: string }) {
  return geminiGenerateTextWithOptions(
    { system: params.system, user: params.user },
    { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 450 },
  )
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

  const evidence = (request.evidence || []).map((e) => {
    const extracted = typeof e.extractedText === "string" ? e.extractedText : ""
    const preview = extracted ? extracted.slice(0, 1800) : ""
    return {
    id: e.id,
    scope: e.scope,
    originalName: e.originalName,
    fileType: e.fileType,
    resourceType: e.resourceType,
    url: e.url,
      extractedTextPreview: preview || undefined,
      extractedTextChars: extracted ? extracted.length : 0,
    createdAt: e.createdAt.toISOString(),
    }
  })

  const system = [
    "Você é um agente VALIDADOR do Alimapa.",
    "Seu trabalho: analisar provas (fotos/documentos) anexadas a uma requisição e preencher um checklist, apontando faltas e inconsistências.",
    "Responda SOMENTE com JSON válido, sem markdown, sem texto extra, sem crases.",
    "Retorne o JSON em UMA ÚNICA LINHA (sem quebras).",
    "Use o schema exato (não inclua campos extras):",
    JSON.stringify(
      {
        verdict: "APPROVE|REVIEW|REJECT",
        confidence: 0.0,
        checklist: [{ item: "string", status: "PASS|FAIL|MISSING", reason: "string" }],
        missing: ["string"],
      },
      null,
      2,
    ),
    "Exemplo de resposta válida:",
    JSON.stringify(
      {
        verdict: "REVIEW",
        confidence: 0.62,
        checklist: [{ item: "Foto externa do local", status: "MISSING", reason: "Nenhuma imagem externa anexada." }],
        missing: ["Foto externa do local"],
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
    "- Preencha missing[] com os itens que NÃO estão PASS.",
  ].join("\n")

  let analysisRaw: string
  try {
    analysisRaw = await callValidatorLLM({ system, user })
  } catch (e: any) {
    const fb = fallbackAnalysis(checklist, evidence.length, `Falha ao chamar IA: ${e?.message || "erro desconhecido"}`)
    await auditLog({
      actorUserId: auth.user.id,
      action: "request.proofs_analyzed",
      entityType: "Request",
      entityId: request.id,
      details: { agentConfigId: agent.id, verdict: fb.verdict, confidence: fb.confidence, fallback: true },
    })
    return ok({ analysis: fb })
  }

  const jsonText = extractJsonObject(analysisRaw) || analysisRaw
  if (!jsonText) {
    const fb = fallbackAnalysis(checklist, evidence.length, `IA retornou resposta inválida (vazia).`)
    await auditLog({
      actorUserId: auth.user.id,
      action: "request.proofs_analyzed",
      entityType: "Request",
      entityId: request.id,
      details: { agentConfigId: agent.id, verdict: fb.verdict, confidence: fb.confidence, fallback: true },
    })
    return ok({ analysis: fb })
  }

  let analysisObj: any
  try {
    analysisObj = JSON.parse(jsonText)
  } catch {
    // retry 1x: re-emite JSON (não tenta consertar string truncada)
    try {
      const retrySystem =
        system +
        "\n\nIMPORTANTE: Sua resposta anterior estava truncada/inválida. Refaça do zero e envie SOMENTE o JSON válido."
      const retryRaw = await callValidatorLLM({ system: retrySystem, user })
      const retryText = extractJsonObject(retryRaw) || retryRaw
      analysisObj = JSON.parse(retryText)
    } catch {
      const fb = fallbackAnalysis(
        checklist,
        evidence.length,
        `IA retornou JSON inválido mesmo após retry. Resposta bruta: ${analysisRaw}`.slice(0, 2000),
      )
      await auditLog({
        actorUserId: auth.user.id,
        action: "request.proofs_analyzed",
        entityType: "Request",
        entityId: request.id,
        details: {
          agentConfigId: agent.id,
          verdict: fb.verdict,
          confidence: fb.confidence,
          fallback: true,
          reason: (fb as any)._internalReason,
        },
      })
      // ainda retornamos JSON no shape esperado (sem campos extras)
      return ok({
        analysis: {
          verdict: fb.verdict,
          confidence: fb.confidence,
          checklist: fb.checklist,
          missing: fb.missing,
          fallback: true,
        },
      })
    }
  }

  const validated = AnalysisSchema.safeParse(analysisObj)
  if (!validated.success) {
    const fb = fallbackAnalysis(
      checklist,
      evidence.length,
      `IA retornou JSON fora do schema esperado. Resposta bruta: ${analysisRaw}`.slice(0, 6000),
    )
    await auditLog({
      actorUserId: auth.user.id,
      action: "request.proofs_analyzed",
      entityType: "Request",
      entityId: request.id,
      details: {
        agentConfigId: agent.id,
        verdict: fb.verdict,
        confidence: fb.confidence,
        fallback: true,
        reason: (fb as any)._internalReason,
      },
    })
    return ok({
      analysis: {
        verdict: fb.verdict,
        confidence: fb.confidence,
        checklist: fb.checklist,
        missing: fb.missing,
        fallback: true,
      },
    })
  }

  await auditLog({
    actorUserId: auth.user.id,
    action: "request.proofs_analyzed",
    entityType: "Request",
    entityId: request.id,
    details: { agentConfigId: agent.id, verdict: validated.data.verdict, confidence: validated.data.confidence },
  })

  return ok({
    analysis: {
      ...validated.data,
      fallback: false,
    },
  })
}


