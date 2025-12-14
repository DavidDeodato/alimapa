"use client"

import { use } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { UrgencyBadge } from "@/components/urgency-badge"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Calendar,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  Sparkles,
  Search,
  MessageSquare,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Offer, Request } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<Request | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [agentConfigs, setAgentConfigs] = useState<Array<{ id: string; farmerName: string; isActive: boolean }>>([])
  const [selectedAgentConfigId, setSelectedAgentConfigId] = useState<string>("")
  const [validatorAgents, setValidatorAgents] = useState<Array<{ id: string; farmerName: string; isActive: boolean }>>([])
  const [selectedValidatorAgentId, setSelectedValidatorAgentId] = useState<string>("")
  const [proofAnalyzing, setProofAnalyzing] = useState(false)
  const [proofProgress, setProofProgress] = useState(0)
  const [proofStep, setProofStep] = useState(0)
  const [proofChecklist, setProofChecklist] = useState<Array<{ item: string; status: "pending" | "checking" | "pass" | "fail" | "missing"; reason?: string }>>([])
  const [proofAnalysis, setProofAnalysis] = useState<any>(null)
  const proofIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentStep, setAgentStep] = useState(0)
  const [matchedFarmers, setMatchedFarmers] = useState<any[]>([])
  const [agentProgress, setAgentProgress] = useState(0)
  const [sendStatuses, setSendStatuses] = useState<Record<string, "pending" | "sending" | "sent">>({})
  const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const canValidate = request?.status === "SUBMITTED"

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/m/requests/${id}`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar requisição")
      setRequest(json.data.request)
      setOffers(json.data.offers ?? [])
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao carregar requisição", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function loadAgents() {
      try {
        const res = await fetch("/api/m/agents")
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) return
        const list = (json.data.agents || []).map((a: any) => ({
          id: a.id,
          farmerName: a.farmerName,
          isActive: !!a.isActive,
          type: a.type,
        }))
        if (!cancelled) {
          const usable = list.filter((a: any) => a.isActive && a.type !== "VALIDATOR")
          setAgentConfigs(usable)
          if (!selectedAgentConfigId && usable.length) setSelectedAgentConfigId(usable[0].id)

          const validators = list.filter((a: any) => a.isActive && a.type === "VALIDATOR")
          setValidatorAgents(validators)
          if (!selectedValidatorAgentId && validators.length) setSelectedValidatorAgentId(validators[0].id)
        }
      } catch {
        // silencioso
      }
    }
    loadAgents()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runAIAgent = async () => {
    if (!selectedAgentConfigId) {
      toast({
        title: "Selecione um agente",
        description: "Você precisa escolher um agente ativo antes de rodar a automação.",
        variant: "destructive",
      })
      return
    }

    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current)
      sendIntervalRef.current = null
    }

    setIsAgentRunning(true)
    setAgentStep(0)
    setAgentProgress(0)
    setMatchedFarmers([])
    setSendStatuses({})

    try {
      setAgentStep(1)
      setAgentProgress(20)
      await new Promise((r) => setTimeout(r, 400))
      setAgentStep(2)
      setAgentProgress(45)

      const res = await fetch(`/api/requests/${id}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentConfigId: selectedAgentConfigId }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao analisar")

      setAgentStep(3)
      setAgentProgress(70)

      // candidatos com explicabilidade (quando disponível)
      const explain = json.data?.explainability?.candidates ?? []
      const candidates =
        Array.isArray(explain) && explain.length
          ? explain.map((c: any) => ({
              id: c.farmerId,
              name: c.farmerName,
              distance: c.distanceKm ?? null,
              products: Array.isArray(c.products) ? c.products : [],
              canFulfill: 100,
              score: c.score ?? 0,
              reason: Array.isArray(c.reasons) ? c.reasons.join(" • ") : "Selecionado por compatibilidade.",
            }))
          : (json.data?.offers ?? []).map((o: any) => ({
              id: o.farmerId,
              name: o.farmerName,
              distance: o.distance ?? null,
              products: (o.items ?? []).map((it: any) => it.productName),
              canFulfill: 100,
              score: 0,
              reason: "Proposta gerada pelo orquestrador.",
            }))
      setMatchedFarmers(candidates)

      const target = candidates.slice(0, 3)
      if (target.length === 0) throw new Error("Nenhum agricultor compatível encontrado.")

      // inicia animação de envio
      setAgentStep(4)
      setAgentProgress(85)
      setSendStatuses(Object.fromEntries(target.map((t: any) => [t.id, "pending"])))
      let idx = -1
      sendIntervalRef.current = setInterval(() => {
        idx += 1
        setSendStatuses((prev) => {
          const next: Record<string, "pending" | "sending" | "sent"> = { ...prev }
          // marca anteriores como enviados
          for (let i = 0; i < target.length; i++) {
            const id = target[i].id
            if (i < idx) next[id] = "sent"
            else if (i === idx) next[id] = "sending"
            else next[id] = "pending"
          }
          return next
        })
        if (idx >= target.length) {
          if (sendIntervalRef.current) clearInterval(sendIntervalRef.current)
          sendIntervalRef.current = null
        }
      }, 900)

      const sendRes = await fetch(`/api/requests/${id}/orchestrate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentConfigId: selectedAgentConfigId, farmerIds: target.map((t: any) => t.id) }),
      })
      const sendJson = await sendRes.json().catch(() => null)
      if (!sendRes.ok || !sendJson?.ok) throw new Error(sendJson?.error || "Falha ao enviar propostas")

      if (sendIntervalRef.current) {
        clearInterval(sendIntervalRef.current)
        sendIntervalRef.current = null
      }
      setSendStatuses((prev) => {
        const next = { ...prev }
        for (const t of target) next[t.id] = "sent"
        return next
      })

      setAgentStep(5)
      setAgentProgress(100)
      toast({ title: "Propostas enviadas", description: "Ofertas criadas e conversas iniciadas. Veja em Conversas." })
      await refresh()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao rodar automação", variant: "destructive" })
    } finally {
      setIsAgentRunning(false)
    }
  }

  const agentSteps = [
    { icon: Search, label: "Analisando requisição", color: "text-blue-500" },
    { icon: Search, label: "Buscando agricultores disponíveis", color: "text-purple-500" },
    { icon: CheckCircle, label: "Comparando requisitos", color: "text-orange-500" },
    { icon: CheckCircle, label: "Selecionando melhores matches", color: "text-green-600" },
    { icon: MessageSquare, label: "Enviando propostas e mensagens...", color: "text-primary" },
  ]

  const proofSteps = [
    { icon: Search, label: "Coletando anexos", color: "text-blue-600" },
    { icon: Search, label: "Extraindo termos dos documentos", color: "text-purple-600" },
    { icon: CheckCircle, label: "Preenchendo checklist", color: "text-orange-600" },
    { icon: Sparkles, label: "Gerando veredito", color: "text-green-700" },
  ]

  const analyzeProofs = async () => {
    if (!selectedValidatorAgentId) {
      toast({ title: "Selecione um agente validador", variant: "destructive" })
      return
    }

    if (proofIntervalRef.current) {
      clearInterval(proofIntervalRef.current)
      proofIntervalRef.current = null
    }

    setProofAnalyzing(true)
    setProofAnalysis(null)
    setProofProgress(0)
    setProofStep(0)

    // checklist base (pra animação) — depois substituímos pelos resultados do backend
    const baseChecklist =
      (validatorAgents.find((a) => a.id === selectedValidatorAgentId) ? [
        "Foto externa do local",
        "Foto interna do local",
        "Documento de identificação",
      ] : ["Foto externa do local", "Foto interna do local", "Documento de identificação"])

    setProofChecklist(baseChecklist.map((item) => ({ item, status: "pending" as const })))

    let tick = 0
    proofIntervalRef.current = setInterval(() => {
      tick += 1
      setProofProgress((p) => Math.min(99, p + 6))
      setProofStep((s) => Math.min(3, Math.floor(tick / 4)))
      // mexe a lupa/checklist
      setProofChecklist((prev) => {
        if (!prev.length) return prev
        const idx = Math.min(prev.length - 1, Math.floor(tick / 3))
        return prev.map((c, i) => {
          if (i < idx) return c.status === "checking" ? { ...c, status: "pending" } : c
          if (i === idx) return { ...c, status: "checking" }
          return c
        })
      })
    }, 350)

    try {
      const res = await fetch(`/api/requests/${id}/proofs/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfigId: selectedValidatorAgentId }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao analisar provas")

      const analysis = json.data.analysis
      setProofAnalysis(analysis)

      // aplicar checklist retornado
      if (Array.isArray(analysis?.checklist) && analysis.checklist.length) {
        setProofChecklist(
          analysis.checklist.map((c: any) => ({
            item: String(c.item || ""),
            status:
              c.status === "PASS" ? "pass" : c.status === "FAIL" ? "fail" : c.status === "MISSING" ? "missing" : "pending",
            reason: c.reason ? String(c.reason) : undefined,
          })),
        )
      }

      setProofProgress(100)
      setProofStep(3)
      toast({ title: "Análise concluída" })
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao analisar provas", variant: "destructive" })
    } finally {
      if (proofIntervalRef.current) {
        clearInterval(proofIntervalRef.current)
        proofIntervalRef.current = null
      }
      setProofAnalyzing(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Requisição #{id}
            </h1>
            {request ? (
              <>
                <StatusBadge status={request.status} />
                <ProgramBadge program={request.program} />
                <UrgencyBadge level={request.urgency} />
              </>
            ) : null}
          </div>
          <p className="text-muted-foreground">{request?.institutionName ?? (loading ? "Carregando..." : "")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/m/requisicoes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações básicas */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Endereço</div>
                  <div className="text-sm text-muted-foreground">{request?.address ?? "-"}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Prazo de entrega</div>
                  <div className="text-sm text-muted-foreground">
                    {request ? new Date(request.needByDate).toLocaleDateString("pt-BR") : "-"}
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <div className="text-sm font-medium mb-2">Justificativa</div>
              <p className="text-sm text-muted-foreground">{request?.justification ?? "-"}</p>
            </div>
          </Card>

          {/* Itens solicitados */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens Solicitados
            </h2>
            <div className="space-y-3">
              {(request?.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Provas e documentos */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Provas e Documentos</h2>
            {((request as any)?.evidence && Array.isArray((request as any).evidence) && (request as any).evidence.length) ? (
              <div className="space-y-3">
                {(request as any).evidence.map((e: any) => (
                  <a
                    key={e.id}
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 rounded border hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-sm font-medium">{e.originalName || e.scope}</div>
                    <div className="text-xs text-muted-foreground truncate">{e.url}</div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma prova anexada.</p>
            )}
          </Card>

          {/* Análise de provas com IA (Validador) */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analisar Provas com IA</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Agente validador</div>
                <Select
                  value={selectedValidatorAgentId || "none"}
                  onValueChange={(v) => setSelectedValidatorAgentId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar agente validador" />
                  </SelectTrigger>
                  <SelectContent>
                    {validatorAgents.length === 0 && <SelectItem value="none">Nenhum validador ativo</SelectItem>}
                    {validatorAgents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.farmerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={analyzeProofs} disabled={proofAnalyzing || !selectedValidatorAgentId}>
                {proofAnalyzing ? "Analisando..." : "Analisar provas (IA)"}
              </Button>

              {proofAnalyzing ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso</span>
                      <span className="text-muted-foreground">{proofProgress}%</span>
                    </div>
                    <Progress value={proofProgress} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    {proofSteps.slice(0, proofStep + 1).map((s, idx) => {
                      const Icon = s.icon
                      const active = idx === proofStep
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                            active ? "bg-muted/50" : "opacity-70",
                          )}
                        >
                          <div className={cn("p-2 rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                            {active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                          </div>
                          <div className={cn("text-sm font-medium", s.color)}>{s.label}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-lg border p-3 bg-muted/30">
                    <div className="text-sm font-medium mb-2">Checklist interno</div>
                    <div className="space-y-2">
                      {proofChecklist.map((c) => (
                        <div key={c.item} className="flex items-center justify-between gap-3">
                          <div className="text-sm">{c.item}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.status === "checking" ? "Analisando..." : c.status === "pending" ? "Pendente" : c.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {proofAnalysis ? (
                <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                  <div className="text-sm font-medium">
                    Veredito: <span className="font-semibold">{proofAnalysis.verdict ?? "-"}</span> • Confiança:{" "}
                    <span className="font-semibold">{Math.round((proofAnalysis.confidence ?? 0) * 100)}%</span>
                  </div>
                  {Array.isArray(proofAnalysis.missing) && proofAnalysis.missing.length ? (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Faltando</div>
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {proofAnalysis.missing.map((x: any, idx: number) => (
                          <li key={idx}>{String(x)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {Array.isArray(proofAnalysis.issues) && proofAnalysis.issues.length ? (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Inconsistências</div>
                      <ul className="list-disc pl-5 text-muted-foreground">
                        {proofAnalysis.issues.map((x: any, idx: number) => (
                          <li key={idx}>{String(x)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {proofAnalysis.notes ? (
                    <div className="text-sm">
                      <div className="font-medium mb-1">Notas</div>
                      <div className="text-muted-foreground whitespace-pre-wrap">{String(proofAnalysis.notes)}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>

          {/* Ações condicionais */}
          {canValidate && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold mb-4">Ações Necessárias</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Esta requisição foi enviada pela instituição e aguarda validação.
              </p>
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/requests/${id}/validate`, { method: "POST" })
                      const json = await res.json()
                      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao validar")
                      toast({ title: "Requisição validada" })
                      await refresh()
                    } catch (e: any) {
                      toast({ title: "Erro", description: e?.message || "Falha ao validar", variant: "destructive" })
                    }
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Validar Requisição
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <XCircle className="h-4 w-4 mr-2" />
                  Solicitar Revisão
                </Button>
              </div>
            </Card>
          )}

          {/* Propostas */}
          {(request?.status === "VALIDATED" || request?.status === "PROPOSALS_SENT" || request?.status === "FULFILLING") && (
            <Card className="card-elevated overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-secondary">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Automação com IA</h2>
                    <p className="text-sm text-muted-foreground">
                      Encontre os melhores fornecedores e envie propostas automaticamente
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Agente selecionado</div>
                  <Select
                    value={selectedAgentConfigId || "none"}
                    onValueChange={(v) => setSelectedAgentConfigId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentConfigs.length === 0 && <SelectItem value="none">Nenhum agente ativo</SelectItem>}
                      {agentConfigs.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.farmerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Esse agente define tom da mensagem e cálculo de proposta (configurado em “Agentes IA”).
                  </p>
                </div>

                {!isAgentRunning && agentStep === 0 && (
                  <Button
                    onClick={runAIAgent}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all duration-300"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Encontrar Melhores Fornecedores e Enviar Propostas Automaticamente
                  </Button>
                )}

                {/* AI Agent Animation */}
                {isAgentRunning && agentStep > 0 && agentStep < 5 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Progresso da Análise</span>
                        <span className="text-muted-foreground">{agentProgress}%</span>
                      </div>
                      <Progress value={agentProgress} className="h-2" />
                    </div>

                    <div className="space-y-4">
                      {agentSteps.slice(0, agentStep + 1).map((step, idx) => {
                        const Icon = step.icon
                        const isActive = idx === agentStep
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl transition-all duration-500",
                              isActive
                                ? "bg-gradient-to-r from-primary/10 to-secondary/10 scale-105 shadow-lg"
                                : "bg-muted/50 opacity-60",
                            )}
                          >
                            <div
                              className={cn(
                                "p-3 rounded-full transition-all duration-500",
                                isActive ? "bg-gradient-to-br from-primary to-secondary animate-pulse" : "bg-muted",
                              )}
                            >
                              {isActive ? (
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                              ) : (
                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground")} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={cn("font-medium", isActive && "text-foreground")}>{step.label}</p>
                              {isActive && (
                                <p className="text-xs text-muted-foreground mt-1 animate-in fade-in">
                                  Processando dados em tempo real...
                                </p>
                              )}
                            </div>
                            {!isActive && idx < agentStep && (
                              <CheckCircle2 className="h-5 w-5 text-green-500 animate-in zoom-in" />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Matched Farmers Results */}
                    {matchedFarmers.length > 0 && agentStep >= 3 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Agricultores Encontrados</h3>
                          <Badge className="bg-gradient-to-r from-primary to-secondary">
                            {matchedFarmers.length} correspondências
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {matchedFarmers.slice(0, 5).map((farmer) => {
                            const status = sendStatuses[farmer.id]
                            return (
                              <Card key={farmer.id} className="p-4 border-2 hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <User className="h-5 w-5 text-primary" />
                                      <h4 className="font-semibold">{farmer.name}</h4>
                                      <Badge variant="outline" className="text-xs">
                                        Score: {farmer.score}%
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{farmer.reason}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                      <span>📍 {farmer.distance ?? "-"}km</span>
                                      <span>📦 {farmer.products.join(", ")}</span>
                                    </div>
                                  </div>

                                  {status ? (
                                    <Badge
                                      variant={status === "sent" ? "default" : "secondary"}
                                      className={cn(status === "sent" && "bg-green-600")}
                                    >
                                      {status === "pending" ? "Aguardando" : status === "sending" ? "Enviando..." : "Enviado"}
                                    </Badge>
                                  ) : null}
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {agentStep === 5 && (
                  <div className="text-center py-8 animate-in fade-in zoom-in">
                    <div className="inline-flex p-4 rounded-full bg-green-100 mb-4">
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Propostas Enviadas!</h3>
                    <p className="text-muted-foreground">
                      O agente enviou mensagens para os agricultores. Você pode acompanhar as conversas na seção de
                      Conversas.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/m/conversas">Ver Conversas</Link>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Linha do Tempo
            </h2>
            <div className="space-y-4">{/* Timeline events */}</div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos
            </h2>
            <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
