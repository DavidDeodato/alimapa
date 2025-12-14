"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Package } from "lucide-react"
import type { Farmer } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function AgricultoresPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [q, setQ] = useState("")

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        const res = await fetch("/api/m/farmers")
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar agricultores")
        if (!cancelled) setFarmers(json.data.farmers || [])
      } catch (e: any) {
        toast({ title: "Erro", description: e?.message || "Falha ao carregar agricultores", variant: "destructive" })
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
    const s = q.trim().toLowerCase()
    if (!s) return farmers
    return farmers.filter((f) => f.name.toLowerCase().includes(s) || f.products.some((p) => p.toLowerCase().includes(s)))
  }, [farmers, q])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agricultores</h1>
          <p className="text-muted-foreground mt-1">Cadastro de agricultores familiares do território</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou produto..."
              className="pl-10"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-5 w-1/2 bg-muted rounded mb-3" />
                <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded mt-4" />
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-sm text-muted-foreground">Nenhum agricultor encontrado.</div>
          ) : (
            filtered.map((farmer) => (
              <Card key={farmer.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{farmer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={farmer.cafStatus === "ATIVO" ? "default" : "secondary"}>
                          CAF {farmer.cafStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Produtos</div>
                        <div className="text-muted-foreground">{farmer.products.join(", ")}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">Localização</div>
                        <div className="text-muted-foreground">{farmer.address ?? "-"}</div>
                      </div>
                    </div>

                    {farmer.capacity && <div className="text-muted-foreground">Capacidade: {farmer.capacity}</div>}
                  </div>

                  <Button asChild size="sm" className="w-full bg-transparent" variant="outline">
                    <Link href={`/m/agricultores/${farmer.id}`}>Ver Perfil</Link>
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
