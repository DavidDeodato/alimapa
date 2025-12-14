"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, User, Calendar } from "lucide-react"
import type { AuditLog } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export default function AuditoriaPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [actionPrefix, setActionPrefix] = useState<string>("all")

  const filtered = useMemo(() => logs, [logs])

  const load = async (cursor?: string) => {
    try {
      const url = new URL("/api/m/audit", window.location.origin)
      url.searchParams.set("limit", "50")
      if (cursor) url.searchParams.set("cursor", cursor)
      if (actionPrefix !== "all") url.searchParams.set("actionPrefix", actionPrefix)

      const res = await fetch(url.toString())
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar auditoria")

      const page: AuditLog[] = json.data.logs || []
      setLogs((prev) => (cursor ? [...prev, ...page] : page))
      setNextCursor(json.data.nextCursor ?? null)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao carregar auditoria", variant: "destructive" })
    }
  }

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        await load(undefined)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionPrefix])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
          <p className="text-muted-foreground mt-1">Registro completo de ações no sistema</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <Select value={actionPrefix} onValueChange={setActionPrefix}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="request.">Requisições</SelectItem>
              <SelectItem value="agent_config.">Agentes</SelectItem>
              <SelectItem value="credit.">Créditos</SelectItem>
              <SelectItem value="conversation.">Conversas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum log encontrado.</div>
          ) : (
            filtered.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground mt-1">{log.details}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {log.actor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {log.entityType} #{log.entityId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>

        {nextCursor ? (
          <div className="pt-4">
            <Button variant="outline" className="bg-transparent" onClick={() => load(nextCursor)} disabled={loading}>
              Carregar mais
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
