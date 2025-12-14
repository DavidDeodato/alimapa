import { getDemoSession } from "@/lib/demo-session"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, MapPin, Package, Calendar, TrendingDown } from "lucide-react"
import type { Offer } from "@/lib/types"
import { EmptyState } from "@/components/empty-state"

export default async function PropostasPage() {
  const session = await getDemoSession()
  if (!session || session.role !== "AGRICULTOR") {
    redirect("/demo")
  }

  const offers: Offer[] = [
    {
      id: "off-001",
      requestId: "req-001",
      farmerId: "farm-001",
      farmerName: "João da Silva",
      status: "SENT",
      items: [
        { id: "1", productName: "Alface", quantity: 50, unit: "kg" },
        { id: "2", productName: "Tomate", quantity: 30, unit: "kg" },
      ],
      proposedValue: 450,
      marketValue: 600,
      distance: 8.5,
      createdAt: "2025-01-11T10:00:00Z",
    },
    {
      id: "off-002",
      requestId: "req-002",
      farmerId: "farm-001",
      farmerName: "João da Silva",
      status: "APPROVED",
      items: [{ id: "3", productName: "Banana", quantity: 100, unit: "kg" }],
      proposedValue: 300,
      marketValue: 450,
      distance: 12.0,
      createdAt: "2025-01-08T14:00:00Z",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Minhas Propostas
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Ao aceitar propostas abaixo do valor de mercado, você gera créditos de impacto que podem ser vendidos no
          marketplace
        </p>
      </div>

      {offers.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma proposta disponível"
          description="Você receberá propostas quando o gestor municipal orquestrar requisições."
        />
      ) : (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="card-elevated hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Informações principais */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Proposta #{offer.id.split("-")[1]}</h3>
                        <Badge
                          variant={offer.status === "SENT" ? "default" : "secondary"}
                          className={
                            offer.status === "SENT"
                              ? "bg-accent/10 text-accent border-accent/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }
                        >
                          {offer.status === "SENT" ? "Aguardando Resposta" : "Aprovada"}
                        </Badge>
                      </div>
                    </div>

                    {/* Valores e créditos gerados */}
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-gradient-to-br from-muted/50 to-background rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Valor da Proposta</span>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {offer.proposedValue?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </div>
                      </div>

                      {offer.marketValue && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingDown className="h-4 w-4" />
                            <span>Créditos de Impacto</span>
                          </div>
                          <div className="text-2xl font-bold text-accent">
                            {offer.marketValue - offer.proposedValue} créditos
                          </div>
                          <div className="text-xs text-muted-foreground">
                            (Diferença do valor de mercado: R$ {offer.marketValue})
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detalhes */}
                    <div className="grid md:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Distância:</span>
                        <span className="font-semibold">{offer.distance} km</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Recebida:</span>
                        <span className="font-semibold">{new Date(offer.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>

                    {/* Itens */}
                    <div className="pt-2 border-t">
                      <div className="text-sm font-semibold mb-2">Itens Solicitados</div>
                      <div className="flex flex-wrap gap-2">
                        {offer.items.map((item) => (
                          <Badge key={item.id} variant="outline" className="text-sm">
                            {item.productName} ({item.quantity} {item.unit})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex lg:flex-col gap-2 lg:w-32">
                    <Button asChild className="flex-1 bg-gradient-to-r from-primary to-secondary h-12">
                      <Link href={`/f/propostas/${offer.id}`}>Abrir</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
