"use client"

import { useState } from "react"
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

export default function RequestDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [agentStep, setAgentStep] = useState(0)
  const [matchedFarmers, setMatchedFarmers] = useState<any[]>([])
  const [agentProgress, setAgentProgress] = useState(0)

  // Mock data
  const request = {
    id,
    institutionId: "inst-001",
    institutionName: "Escola Municipal João Paulo II",
    program: "PNAE" as const,
    status: "VALIDATED" as const,
    urgency: 4 as const,
    needByDate: "2025-01-20",
    items: [
      { id: "1", productName: "Alface", quantity: 50, unit: "kg" },
      { id: "2", productName: "Tomate", quantity: 30, unit: "kg" },
    ],
    address: "Rua das Flores, 123",
    justification: "Reposição da merenda escolar para 500 alunos da rede municipal.",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  }

  const runAIAgent = async () => {
    setIsAgentRunning(true)
    setAgentStep(0)
    setAgentProgress(0)

    // Step 1: Analyzing request
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setAgentStep(1)
    setAgentProgress(25)

    // Step 2: Finding farmers
    await new Promise((resolve) => setTimeout(resolve, 2500))
    setAgentStep(2)
    setAgentProgress(50)

    // Step 3: Matching requirements
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setMatchedFarmers([
      {
        id: "f1",
        name: "João da Silva",
        distance: 5.2,
        products: ["Alface", "Tomate"],
        canFulfill: 100,
        score: 98,
        reason: "Distância muito próxima (5.2km) e possui todos os produtos solicitados em estoque",
      },
      {
        id: "f2",
        name: "Maria Santos",
        distance: 8.5,
        products: ["Alface"],
        canFulfill: 50,
        score: 85,
        reason: "Possui alface em estoque mas não possui tomate. Distância razoável (8.5km)",
      },
      {
        id: "f3",
        name: "Pedro Oliveira",
        distance: 12.3,
        products: ["Alface", "Tomate"],
        canFulfill: 100,
        score: 75,
        reason: "Possui todos os produtos mas a distância é maior (12.3km), aumentando custos de transporte",
      },
    ])
    setAgentStep(3)
    setAgentProgress(75)

    // Step 4: Ready to send
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setAgentStep(4)
    setAgentProgress(100)
  }

  const sendProposals = async (farmerIds: string[]) => {
    setAgentStep(5)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsAgentRunning(false)
    setAgentStep(0)
  }

  const agentSteps = [
    { icon: Search, label: "Analisando requisição", color: "text-blue-500" },
    { icon: Search, label: "Buscando agricultores disponíveis", color: "text-purple-500" },
    { icon: CheckCircle, label: "Comparando requisitos", color: "text-orange-500" },
    { icon: MessageSquare, label: "Propostas prontas para envio", color: "text-green-500" },
    { icon: CheckCircle2, label: "Enviando mensagens...", color: "text-primary" },
  ]

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Requisição #{id}
            </h1>
            <StatusBadge status={request.status} />
            <ProgramBadge program={request.program} />
            <UrgencyBadge level={request.urgency} />
          </div>
          <p className="text-muted-foreground">{request.institutionName}</p>
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
                  <div className="text-sm text-muted-foreground">{request.address}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Prazo de entrega</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(request.needByDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-4" />
            <div>
              <div className="text-sm font-medium mb-2">Justificativa</div>
              <p className="text-sm text-muted-foreground">{request.justification}</p>
            </div>
          </Card>

          {/* Itens solicitados */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens Solicitados
            </h2>
            <div className="space-y-3">
              {request.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Ações condicionais */}
          {request.status === "SUBMITTED" && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold mb-4">Ações Necessárias</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Esta requisição foi enviada pela instituição e aguarda validação.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1">
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

          {request.status === "VALIDATED" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h2 className="text-xl font-semibold mb-4">Próxima Etapa</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Requisição validada. Você pode agora rodar o orquestrador para encontrar agricultores compatíveis.
              </p>
              <Button className="w-full">Rodar Orquestrador</Button>
            </Card>
          )}

          {/* Propostas */}
          {request.status === "VALIDATED" && (
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

                {!isAgentRunning && agentStep === 0 && (
                  <Button
                    onClick={runAIAgent}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all duration-300"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Encontrar Melhores Fornecedores e Propor Ofertas com Agente de IA
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
                    {agentStep === 3 && matchedFarmers.length > 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Agricultores Encontrados</h3>
                          <Badge className="bg-gradient-to-r from-primary to-secondary">
                            {matchedFarmers.length} correspondências
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {matchedFarmers.map((farmer) => (
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
                                    <span>📍 {farmer.distance}km</span>
                                    <span>📦 {farmer.products.join(", ")}</span>
                                    <span>✅ {farmer.canFulfill}% atendido</span>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => sendProposals(matchedFarmers.map((f) => f.id))}
                            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Enviar Propostas para Todos
                          </Button>
                          <Button
                            onClick={() => sendProposals([matchedFarmers[0].id])}
                            variant="outline"
                            className="flex-1"
                          >
                            Enviar para Melhor Match
                          </Button>
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
