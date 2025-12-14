"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { UrgencyBadge } from "@/components/urgency-badge"
import { Search, Filter } from "lucide-react"
import type { Request } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function RequisicoesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<Request[]>([])
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("all")
  const [program, setProgram] = useState("all")

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch("/api/m/requests")
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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return requests.filter((r) => {
      const matchQ = !qq || r.institutionName.toLowerCase().includes(qq) || (r.address ?? "").toLowerCase().includes(qq)
      const matchStatus = status === "all" || r.status === status
      const matchProgram = program === "all" || r.program === program
      return matchQ && matchStatus && matchProgram
    })
  }, [requests, q, status, program])

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Requisições
          </h1>
          <p className="text-muted-foreground text-lg">Gerencie todas as requisições do território</p>
        </div>
      </div>

      <Card className="card-elevated p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por instituição..."
              className="pl-10 h-11"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="SUBMITTED">Enviada</SelectItem>
              <SelectItem value="VALIDATED">Validada</SelectItem>
              <SelectItem value="FULFILLING">Em atendimento</SelectItem>
              <SelectItem value="CLOSED">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Programa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos programas</SelectItem>
              <SelectItem value="PNAE">PNAE</SelectItem>
              <SelectItem value="PAA">PAA</SelectItem>
              <SelectItem value="OUTROS">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-11 w-11 bg-transparent">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Instituição</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Programa</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Urgência</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Prazo</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t">
                  <td className="p-6 text-sm text-muted-foreground" colSpan={6}>
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr className="border-t">
                  <td className="p-6 text-sm text-muted-foreground" colSpan={6}>
                    Nenhuma requisição encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((request) => (
                <tr key={request.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold">{request.institutionName}</div>
                    <div className="text-sm text-muted-foreground mt-1">{request.address}</div>
                  </td>
                  <td className="p-4">
                    <ProgramBadge program={request.program} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="p-4">
                    <UrgencyBadge level={request.urgency} />
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{new Date(request.needByDate).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="p-4">
                    <Button asChild size="sm" className="bg-gradient-to-r from-primary to-secondary">
                      <Link href={`/m/requisicoes/${request.id}`}>Abrir</Link>
                    </Button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
