"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TerritorialMap } from "@/components/territorial-map"
import { RequestStatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { UrgencyBadge } from "@/components/urgency-badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { FileText, Users, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { Request, Farmer } from "@/lib/types"
import Link from "next/link"

interface Dashboard {
  pendingValidation: number
  orchestrating: number
  fulfilling: number
  closed: number
  activeFarmers: number
  centerLat: number
  centerLng: number
}

export default function PainelPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/m/dashboard")
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (!data?.ok) throw new Error()

      setDashboard(data.data.dashboard)
      setRequests(data.data.requests || [])
      setFarmers(data.data.farmers || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o painel.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (requestId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}/validate`, {
        method: "POST",
      })
      if (!response.ok) throw new Error()

      toast({
        title: "Sucesso",
        description: "Requisição validada. Agora você pode rodar a orquestração.",
      })

      await loadDashboard()
      setSelectedRequest(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao validar requisição.",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleOrchestrate = async (requestId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/requests/${requestId}/orchestrate`, {
        method: "POST",
      })
      if (!response.ok) throw new Error()

      toast({
        title: "Sucesso",
        description: "Propostas enviadas para agricultores selecionados.",
      })

      await loadDashboard()
      setSelectedRequest(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao orquestrar. Tente novamente.",
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Territorial</h1>
        <p className="text-sm text-muted-foreground">Visão integrada da cadeia de segurança alimentar do município</p>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.pendingValidation || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Em orquestração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.orchestrating || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Em atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.fulfilling || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.closed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agricultores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activeFarmers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa do Território</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[500px]">
            <TerritorialMap
              requests={requests}
              farmers={farmers}
              onRequestClick={setSelectedRequest}
              centerLat={dashboard?.centerLat}
              centerLng={dashboard?.centerLng}
            />
          </div>
        </CardContent>
      </Card>

      {/* Priority queue */}
      <Card>
        <CardHeader>
          <CardTitle>Fila de Prioridade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.slice(0, 5).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{request.institutionName}</span>
                    <ProgramBadge program={request.program} />
                    <UrgencyBadge urgency={request.urgency} />
                    <RequestStatusBadge status={request.status} />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Prazo: {new Date(request.needByDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Link href={`/m/requisicoes/${request.id}`}>
                  <Button size="sm">Abrir</Button>
                </Link>
              </div>
            ))}
            {requests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhuma requisição na fila de prioridade.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request detail drawer */}
      <Sheet open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedRequest && (
            <>
              <SheetHeader>
                <SheetTitle>Requisição #{selectedRequest.id.slice(0, 8)}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status e Programa</h3>
                  <div className="flex gap-2">
                    <RequestStatusBadge status={selectedRequest.status} />
                    <ProgramBadge program={selectedRequest.program} />
                    <UrgencyBadge urgency={selectedRequest.urgency} />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Instituição</h3>
                  <p className="text-sm">{selectedRequest.institutionName}</p>
                  {selectedRequest.address && (
                    <p className="text-sm text-muted-foreground">{selectedRequest.address}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Prazo</h3>
                  <p className="text-sm">{new Date(selectedRequest.needByDate).toLocaleDateString("pt-BR")}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Itens Solicitados</h3>
                  <ul className="space-y-1">
                    {selectedRequest.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        {item.productName}: {item.quantity} {item.unit}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 space-y-2">
                  {selectedRequest.status === "SUBMITTED" && (
                    <Button
                      className="w-full"
                      onClick={() => handleValidate(selectedRequest.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Validando..." : "Validar requisição"}
                    </Button>
                  )}

                  {selectedRequest.status === "VALIDATED" && (
                    <Button
                      className="w-full"
                      onClick={() => handleOrchestrate(selectedRequest.id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Orquestrando..." : "Rodar orquestrador"}
                    </Button>
                  )}

                  <Link href={`/m/requisicoes/${selectedRequest.id}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Ver detalhes completos
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
