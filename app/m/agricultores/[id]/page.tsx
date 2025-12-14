"use client"

import { use } from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Phone, FileText } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

type FarmerDetail = {
  id: string
  name: string
  products: string[]
  capacity?: string
  cafStatus: "ATIVO" | "PENDENTE" | "INATIVO"
  address?: string
  phone?: string
  lat?: number
  lng?: number
}

export default function FarmerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch(`/api/m/farmers/${id}`)
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar agricultor")
        if (!cancelled) setFarmer(json.data.farmer)
      } catch (e: any) {
        toast({ title: "Erro", description: e?.message || "Falha ao carregar agricultor", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (id) run()
    return () => {
      cancelled = true
    }
  }, [id, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{farmer?.name ?? (loading ? "Carregando..." : "Agricultor")}</h1>
            {farmer ? (
              <Badge variant={farmer.cafStatus === "ATIVO" ? "default" : "secondary"}>CAF {farmer.cafStatus}</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground">Agricultor Familiar</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/m/agricultores">Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações de Contato</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Endereço</div>
                <div className="text-sm text-muted-foreground">{farmer?.address ?? "-"}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Telefone</div>
                <div className="text-sm text-muted-foreground">{farmer?.phone ?? "-"}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos e Capacidade
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Produtos Disponíveis</div>
              <div className="flex flex-wrap gap-2">
                {(farmer?.products ?? []).map((product) => (
                  <Badge key={product} variant="outline">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Capacidade de Produção</div>
              <div className="text-sm text-muted-foreground">{farmer?.capacity ?? "-"}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Participação
          </h2>
          <p className="text-sm text-muted-foreground">Nenhum histórico de participação disponível</p>
        </Card>
      </div>
    </div>
  )
}
