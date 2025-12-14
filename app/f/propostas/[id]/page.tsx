"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Check, X, Package, DollarSign, MapPin, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type OfferDetail = {
  id: string
  requestId: string
  status: string
  items: Array<{ id: string; productName: string; quantity: number; unit: string }>
  proposedValue?: number
  marketValue?: number
  distance?: number
  needByDate: string
  institutionName: string
  address?: string
  createdAt: string
}

export default function PropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/f/offers/${id}`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar proposta")
      setOffer(json.data.offer)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao carregar proposta", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const accept = async () => {
    if (!offer) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/f/offers/${offer.id}/accept`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao aceitar")
      toast({ title: "Proposta aceita" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao aceitar", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const decline = async () => {
    if (!offer) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/f/offers/${offer.id}/decline`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao recusar")
      toast({ title: "Proposta recusada" })
      await refresh()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao recusar", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Proposta #{id}</h1>
            <Badge variant="default">{offer?.status === "SENT" ? "Aguardando Resposta" : offer?.status ?? ""}</Badge>
          </div>
          <p className="text-muted-foreground">{offer?.institutionName ?? (loading ? "Carregando..." : "")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/f/propostas">Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes da Proposta</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Distância</div>
                  <div className="text-sm text-muted-foreground">{offer?.distance ?? "-"} km</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Valor Proposto</div>
                  <div className="text-sm text-muted-foreground">
                    {offer?.proposedValue != null ? `R$ ${offer.proposedValue.toFixed(2)}` : "-"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Prazo de Entrega</div>
                  <div className="text-sm text-muted-foreground">
                    {offer?.needByDate ? new Date(offer.needByDate).toLocaleDateString("pt-BR") : "-"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Itens Solicitados
            </h2>
            <div className="space-y-3">
              {(offer?.items ?? []).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {offer?.status === "SENT" && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold mb-4">Responder à Proposta</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Você pode aceitar esta proposta ou conversar com o agente para esclarecer dúvidas.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={accept} disabled={actionLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  Aceitar Proposta
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent" onClick={decline} disabled={actionLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Precisa de Ajuda?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Converse com nosso agente para esclarecer dúvidas sobre capacidade, prazos e documentação.
            </p>
            <Button asChild className="w-full bg-transparent" variant="outline">
              <Link href={`/f/propostas/${id}/chat`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Abrir Chat
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
