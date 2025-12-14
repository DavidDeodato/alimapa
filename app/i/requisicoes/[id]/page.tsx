"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { Calendar, Package, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import type { Request } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function InstituicaoRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<Request | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/i/requests/${id}`)
        const json = await res.json()
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar requisição")
        if (!cancelled) setRequest(json.data.request)
      } catch (e: any) {
        toast({ title: "Erro", description: e?.message || "Falha ao carregar requisição", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [id, toast])

  if (loading) return <div className="text-sm text-muted-foreground">Carregando...</div>
  if (!request) return <div className="text-sm text-muted-foreground">Requisição não encontrada.</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Requisição #{id}</h1>
            <StatusBadge status={request.status} />
            <ProgramBadge program={request.program} />
          </div>
          <p className="text-muted-foreground">{request.institutionName}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/i/requisicoes">Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes da Requisição</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Prazo:</span>
                <span className="text-muted-foreground">
                  {new Date(request.needByDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Justificativa</div>
                <p className="text-sm text-muted-foreground">{request.justification}</p>
              </div>
            </div>
          </Card>

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

          {request.status === "FULFILLING" && (
            <Card className="p-6 bg-green-50 border-green-200">
              <h2 className="text-xl font-semibold mb-4">Ação Necessária</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sua requisição está em atendimento. Quando receber os itens, confirme o recebimento.
              </p>
              <Button className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Recebimento
              </Button>
            </Card>
          )}
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Status Atual</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Requisição criada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Validada pelo município</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Agricultores selecionados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Em atendimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-sm text-muted-foreground">Aguardando confirmação</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
