import { prisma } from "@/lib/db"
import { haversineKm } from "@/lib/geo"
import { geminiGenerateText } from "@/lib/gemini"
import { auditLog } from "@/lib/audit"

const MARKET_PRICE: Record<string, number> = {
  Alface: 5,
  Tomate: 6,
  Banana: 4.5,
  Cenoura: 4,
  Batata: 3.5,
  Mandioca: 3,
  Milho: 2.8,
  Couve: 4.2,
  "Cheiro-verde": 2,
  Abóbora: 3.8,
  Mamão: 6.5,
  Laranja: 3.2,
  Limão: 4.1,
  Cebola: 5.2,
  Pimentão: 7,
}

function computeMarketValue(items: Array<{ productName: string; quantity: number }>) {
  return items.reduce((sum, item) => sum + (MARKET_PRICE[item.productName] ?? 5) * item.quantity, 0)
}

function computeProposedValue(
  marketValue: number,
  fixedDiscounts: Record<string, number> | null,
  items: Array<{ productName: string; quantity: number }>,
) {
  if (!fixedDiscounts) return marketValue * 0.85
  // desconto ponderado por valor de mercado
  const total = items.reduce((sum, item) => sum + (MARKET_PRICE[item.productName] ?? 5) * item.quantity, 0) || 1
  const weightedDiscount =
    items.reduce((sum, item) => {
      const price = MARKET_PRICE[item.productName] ?? 5
      const pct = fixedDiscounts[item.productName.toLowerCase()] ?? fixedDiscounts[item.productName] ?? 10
      return sum + (pct / 100) * (price * item.quantity)
    }, 0) / total
  const multiplier = 1 - Math.min(Math.max(weightedDiscount, 0.05), 0.35)
  return marketValue * multiplier
}

export async function orchestrateRequest(params: {
  requestId: string
  startedByUserId: string
  agentConfigId?: string
  farmerIds?: string[]
}) {
  const request = await prisma.request.findUnique({
    where: { id: params.requestId },
    include: {
      institution: true,
      items: true,
      municipality: true,
    },
  })
  if (!request) throw new Error("Requisição não encontrada")
  if (request.status !== "VALIDATED") throw new Error("A requisição precisa estar VALIDATED para orquestrar")

  const selectedAgentConfig = params.agentConfigId
    ? await prisma.agentConfig.findUnique({ where: { id: params.agentConfigId } })
    : null
  if (params.agentConfigId) {
    if (!selectedAgentConfig) throw new Error("Agente não encontrado")
    if (!selectedAgentConfig.isActive) throw new Error("Agente inativo")
    if (selectedAgentConfig.municipalityId !== request.municipalityId) throw new Error("Agente não pertence ao município da requisição")
    if (selectedAgentConfig.type !== "NEGOTIATOR") throw new Error("Agente selecionado não é do tipo NEGOTIATOR")
  }

  const farmers = await prisma.farmer.findMany({
    where: { municipalityId: request.municipalityId },
  })

  const reqProducts = new Set(request.items.map((i) => i.productName.toLowerCase()))
  const reqPoint =
    request.lat != null && request.lng != null ? { lat: request.lat, lng: request.lng } : request.municipality.centerLat && request.municipality.centerLng
      ? { lat: request.municipality.centerLat, lng: request.municipality.centerLng }
      : null

  const ranked = farmers
    .map((f) => {
      const overlap = f.products.filter((p) => reqProducts.has(p.toLowerCase())).length
      const dist =
        reqPoint && f.lat != null && f.lng != null ? haversineKm(reqPoint, { lat: f.lat, lng: f.lng }) : null
      const cafBonus = f.cafStatus === "ATIVO" ? 10 : f.cafStatus === "PENDENTE" ? 5 : 0
      const score = overlap * 30 + cafBonus + (dist == null ? 0 : Math.max(0, 20 - dist))
      const reasons: string[] = []
      if (overlap > 0) reasons.push(`Compatibilidade de produtos (${overlap})`)
      if (dist != null) reasons.push(`Distância estimada: ${dist.toFixed(1)} km`)
      reasons.push(`CAF: ${f.cafStatus}`)
      return { farmer: f, overlap, dist, score, reasons }
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.score - a.score)

  const top = Array.isArray(params.farmerIds) && params.farmerIds.length
    ? ranked.filter((r) => params.farmerIds!.includes(r.farmer.id)).slice(0, 3)
    : ranked.slice(0, 3)
  if (top.length === 0) {
    await prisma.request.update({
      where: { id: request.id },
      data: { status: "NEEDS_REVIEW" },
    })
    await auditLog({
      actorUserId: params.startedByUserId,
      action: "request.orchestrate_failed",
      entityType: "Request",
      entityId: request.id,
      details: { reason: "Nenhum agricultor compatível encontrado" },
    })
    return { offers: [], explainability: { candidates: [] } }
  }

  const explainability = {
    requestId: request.id,
    candidates: ranked.slice(0, 5).map((r) => ({
      farmerId: r.farmer.id,
      farmerName: r.farmer.name,
      score: r.score,
      distanceKm: r.dist,
      reasons: r.reasons,
      products: r.farmer.products,
    })),
  }

  const run = await prisma.agentRun.create({
    data: {
      requestId: request.id,
      startedByUserId: params.startedByUserId,
      status: "DONE",
      explainability,
      createdOffers: [],
    },
  })

  const offers = []
  for (const candidate of top) {
    const agentConfig =
      selectedAgentConfig ||
      (await prisma.agentConfig.findFirst({
        where: { municipalityId: request.municipalityId, farmerId: candidate.farmer.id, type: "NEGOTIATOR", isActive: true },
      })) ||
      (await prisma.agentConfig.findFirst({
        where: { municipalityId: request.municipalityId, farmerId: null, type: "NEGOTIATOR", isActive: true },
      }))

    const items = request.items.map((i) => ({ productName: i.productName, quantity: Number(i.quantity), unit: i.unit }))
    const marketValue = computeMarketValue(items)
    const proposedValue = computeProposedValue(
      marketValue,
      agentConfig?.fixedDiscounts ? agentConfig.fixedDiscounts : null,
      items.map((i) => ({ productName: i.productName, quantity: i.quantity })),
    )

    const offer = await prisma.offer.create({
      data: {
        requestId: request.id,
        farmerId: candidate.farmer.id,
        status: "SENT",
        marketValue,
        proposedValue,
        distanceKm: candidate.dist,
        items: {
          create: items.map((it) => ({ productName: it.productName, quantity: it.quantity, unit: it.unit })),
        },
      },
    })

    const sys = [
      `Você é o agente do Alimapa responsável por propor ofertas e iniciar uma conversa com o agricultor.`,
      `Sempre fale em PT-BR. Seja claro, curto e respeitoso.`,
      agentConfig?.personality ? `Personalidade: ${agentConfig.personality}` : null,
      Array.isArray(agentConfig?.objectives) && agentConfig!.objectives.length
        ? `Objetivos: ${agentConfig!.objectives.join("; ")}`
        : null,
      agentConfig?.instructions ? `Instruções adicionais: ${agentConfig.instructions}` : null,
    ]
      .filter(Boolean)
      .join("\n")

    const user = `Gere uma mensagem inicial curta para o agricultor ${candidate.farmer.name} com base na requisição.\n\nRequisição:\n- Programa: ${request.program}\n- Itens: ${items.map((i) => `${i.quantity}${i.unit} ${i.productName}`).join(", ")}\n- Prazo: ${request.needByDate.toISOString().slice(0, 10)}\n- Valor de mercado estimado: R$ ${marketValue.toFixed(2)}\n- Proposta: R$ ${proposedValue.toFixed(2)}\n\nPeça confirmação de capacidade e disponibilidade.`

    let initialMessage: string
    try {
      initialMessage = await geminiGenerateText({ system: sys, user })
    } catch {
      initialMessage = `Olá ${candidate.farmer.name}! Temos uma requisição ${request.program} com ${items
        .map((i) => `${i.quantity}${i.unit} de ${i.productName}`)
        .join(", ")}.\nPrazo: ${new Date(request.needByDate).toLocaleDateString("pt-BR")}.\nValor de mercado estimado: R$ ${marketValue.toFixed(
        2,
      )}. Posso oferecer R$ ${proposedValue.toFixed(2)}.\nVocê consegue atender?`
    }

    await prisma.conversation.create({
      data: {
        offerId: offer.id,
        farmerId: candidate.farmer.id,
        agentConfigId: agentConfig?.id ?? null,
        status: "ACTIVE",
        unreadFarmer: 1,
        unreadManager: 0,
        lastMessageAt: new Date(),
        messages: {
          create: [{ sender: "ASSISTANT", content: initialMessage, metadata: { offerId: offer.id, source: "AGENT" } }],
        },
      },
    })

    offers.push(offer)
  }

  await prisma.agentRun.update({
    where: { id: run.id },
    data: { createdOffers: offers.map((o) => o.id) },
  })

  await prisma.request.update({
    where: { id: request.id },
    data: { status: "PROPOSALS_SENT" },
  })

  await auditLog({
    actorUserId: params.startedByUserId,
    action: "request.orchestrated",
    entityType: "Request",
    entityId: request.id,
    details: { runId: run.id, offersCreated: offers.map((o) => o.id), explainability },
  })

  return { offers, explainability, runId: run.id }
}

export async function analyzeRequest(params: { requestId: string }) {
  const request = await prisma.request.findUnique({
    where: { id: params.requestId },
    include: {
      institution: true,
      items: true,
      municipality: true,
    },
  })
  if (!request) throw new Error("Requisição não encontrada")
  if (request.status !== "VALIDATED") throw new Error("A requisição precisa estar VALIDATED para analisar")

  const farmers = await prisma.farmer.findMany({
    where: { municipalityId: request.municipalityId },
  })

  const reqProducts = new Set(request.items.map((i) => i.productName.toLowerCase()))
  const reqPoint =
    request.lat != null && request.lng != null
      ? { lat: request.lat, lng: request.lng }
      : request.municipality.centerLat && request.municipality.centerLng
        ? { lat: request.municipality.centerLat, lng: request.municipality.centerLng }
        : null

  const ranked = farmers
    .map((f) => {
      const overlap = f.products.filter((p) => reqProducts.has(p.toLowerCase())).length
      const dist = reqPoint && f.lat != null && f.lng != null ? haversineKm(reqPoint, { lat: f.lat, lng: f.lng }) : null
      const cafBonus = f.cafStatus === "ATIVO" ? 10 : f.cafStatus === "PENDENTE" ? 5 : 0
      const score = overlap * 30 + cafBonus + (dist == null ? 0 : Math.max(0, 20 - dist))
      const reasons: string[] = []
      if (overlap > 0) reasons.push(`Compatibilidade de produtos (${overlap})`)
      if (dist != null) reasons.push(`Distância estimada: ${dist.toFixed(1)} km`)
      reasons.push(`CAF: ${f.cafStatus}`)
      return { farmer: f, overlap, dist, score, reasons }
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.score - a.score)

  const explainability = {
    requestId: request.id,
    candidates: ranked.slice(0, 5).map((r) => ({
      farmerId: r.farmer.id,
      farmerName: r.farmer.name,
      score: r.score,
      distanceKm: r.dist,
      reasons: r.reasons,
      products: r.farmer.products,
    })),
  }

  return { explainability }
}


