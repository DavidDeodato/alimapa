"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, CheckCircle2, FileText, ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function CreditDetailClient({ id }: { id: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [credit, setCredit] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/c/credits/${id}`)
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar crédito")
      setCredit(json.data.credit)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao carregar crédito", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleBuy = async () => {
    try {
      const res = await fetch(`/api/c/credits/${id}/buy`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao comprar crédito")
      toast({ title: "Compra concluída" })
      await load()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao comprar", variant: "destructive" })
    }
  }

  const timeline = credit?.backing
    ? [
        { action: "Crédito emitido", timestamp: credit.createdAt, status: "completed" },
        { action: "Entrega confirmada", timestamp: credit.backing.deliveryConfirmedAt, status: "completed" },
        ...(credit.status === "VENDIDO"
          ? [{ action: "Crédito comprado", timestamp: credit.purchasedAt ?? credit.updatedAt, status: "completed" }]
          : []),
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Crédito de Impacto</h1>
            <Badge variant="default">{credit?.status === "VENDIDO" ? "Vendido" : "Disponível"}</Badge>
          </div>
          <p className="text-muted-foreground">{loading ? "Carregando..." : credit?.institutionName ?? ""}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/c/marketplace">Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resumo do Crédito
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold">{credit?.impactCredits ?? "-"}</div>
                <div className="text-lg text-muted-foreground">{credit?.unitType ?? "-"}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Agricultor</div>
                  <div className="text-muted-foreground">{credit?.farmerName ?? "-"}</div>
                </div>
                <div>
                  <div className="font-medium">Emissão</div>
                  <div className="text-muted-foreground">
                    {credit?.createdAt ? new Date(credit.createdAt).toLocaleDateString("pt-BR") : "-"}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Lastro - Linha do Tempo
            </h2>
            <div className="space-y-4">
              {timeline.length ? (
                timeline.map((event: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      {idx < timeline.length - 1 && <div className="h-full w-px bg-border mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-medium">{event.action}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(event.timestamp).toLocaleString("pt-BR")}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Sem timeline disponível.</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Evidências
            </h2>
            <p className="text-sm text-muted-foreground">Em breve: anexos do lastro (fotos/documentos).</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Adquirir Crédito</h2>
            <p className="text-sm text-muted-foreground mb-4">Compra registra o lastro e move o crédito para “Minhas Compras”.</p>
            <Button className="w-full mb-3" onClick={handleBuy} disabled={loading || credit?.status !== "DISPONIVEL"}>
              {credit?.status === "VENDIDO" ? "Já comprado" : "Comprar Crédito"}
            </Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href={credit?.requestId ? `/m/requisicoes/${credit.requestId}` : "/c/marketplace"}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Requisição Original
              </Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Certificação</h2>
            <p className="text-sm text-muted-foreground">Em breve: certificado/arquivo de comprovação.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}


