"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Coins, TrendingUp, Package, DollarSign, Store, ExternalLink } from "lucide-react"
import type { ImpactCredit } from "@/lib/types"
import { ProgramBadge } from "@/components/program-badge"
import { EmptyState } from "@/components/empty-state"

export default function MeusCreditosPage() {
  const [credits, setCredits] = useState<ImpactCredit[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const response = await fetch("/api/f/credits")
      if (response.ok) {
        const data = await response.json()
        if (data?.ok) setCredits(data.data.credits || [])
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar créditos",
        description: "Não foi possível carregar seus créditos de impacto.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleListOnMarketplace = async (creditId: string) => {
    try {
      const response = await fetch(`/api/f/credits/${creditId}/list`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Crédito anunciado",
          description: "Seu crédito de impacto está disponível no marketplace.",
        })
        fetchCredits()
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível anunciar o crédito.",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const totalCredits = credits.reduce((sum, c) => sum + c.impactCredits, 0)
  const availableCredits = credits.filter((c) => c.status === "DISPONIVEL")
  const soldCredits = credits.filter((c) => c.status === "VENDIDO")

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Meus Créditos de Impacto
        </h1>
        <p className="text-muted-foreground">Gerencie e venda seus créditos lastreados em entregas confirmadas</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Créditos</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">créditos gerados</p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponíveis</CardTitle>
            <Store className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{availableCredits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">para venda</p>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendidos</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{soldCredits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">transações</p>
          </CardContent>
        </Card>
      </div>

      {/* Credits List */}
      {credits.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="Nenhum crédito disponível"
          description="Você receberá créditos de impacto quando aceitar propostas por valores abaixo do mercado."
        />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Créditos</h2>
          <div className="grid gap-4">
            {credits.map((credit) => (
              <Card key={credit.id} className="card-elevated">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Coins className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {credit.impactCredits} créditos de {credit.unitType}
                          </h3>
                          <p className="text-sm text-muted-foreground">{credit.institutionName}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Valor Monetário:</span>
                            <span className="font-semibold">
                              {credit.monetaryValue.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Programa:</span>
                            <ProgramBadge program={credit.program} />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge
                              variant={credit.status === "DISPONIVEL" ? "default" : "secondary"}
                              className={
                                credit.status === "DISPONIVEL"
                                  ? "bg-accent/10 text-accent border-accent/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                              }
                            >
                              {credit.status === "DISPONIVEL" ? "Disponível" : "Vendido"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Criado:</span>
                            <span className="font-medium">
                              {new Date(credit.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {credit.status === "VENDIDO" && credit.purchasedBy && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Vendido para: <span className="font-medium text-foreground">{credit.purchasedBy}</span> em{" "}
                            {new Date(credit.purchasedAt!).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {credit.status === "DISPONIVEL" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleListOnMarketplace(credit.id)}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Anunciar
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          Vendido
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
