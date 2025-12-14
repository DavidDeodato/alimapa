"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { Plus, Calendar } from "lucide-react"
import type { Request } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function InstituicaoRequisicoesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch("/api/i/requests")
        const json = await res.json()
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar requisições")
        if (!cancelled) setRequests(json.data.requests)
      } catch (e: any) {
        toast({ title: "Erro", description: e?.message || "Falha ao carregar requisições", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Requisições</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas solicitações de alimentos</p>
        </div>
        <Button asChild>
          <Link href="/i/nova-requisicao">
            <Plus className="h-4 w-4 mr-2" />
            Nova Requisição
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Carregando...</Card>
        ) : requests.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">Você ainda não criou nenhuma requisição.</Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">Requisição #{request.id}</h3>
                    <StatusBadge status={request.status} />
                    <ProgramBadge program={request.program} />
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Prazo: {new Date(request.needByDate).toLocaleDateString("pt-BR")}
                    </div>
                    <div>Itens: {request.items.map((i) => i.productName).join(", ")}</div>
                  </div>
                </div>

                <Button asChild size="sm">
                  <Link href={`/i/requisicoes/${request.id}`}>Abrir</Link>
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
