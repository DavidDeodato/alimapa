import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Check, X, Package, DollarSign, MapPin, Calendar } from "lucide-react"

export default async function PropostaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "AGRICULTOR") redirect("/auth/login")

  const { id } = await params

  const offer = {
    id,
    requestId: "req-001",
    farmerId: "farm-001",
    farmerName: "João da Silva",
    status: "SENT" as const,
    items: [
      { id: "1", productName: "Alface", quantity: 50, unit: "kg" },
      { id: "2", productName: "Tomate", quantity: 30, unit: "kg" },
    ],
    proposedValue: 450,
    distance: 8.5,
    needByDate: "2025-01-20",
    institutionName: "Escola Municipal João Paulo II",
    createdAt: "2025-01-11T10:00:00Z",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Proposta #{id}</h1>
            <Badge variant="default">Aguardando Resposta</Badge>
          </div>
          <p className="text-muted-foreground">{offer.institutionName}</p>
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
                  <div className="text-sm text-muted-foreground">{offer.distance} km</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Valor Proposto</div>
                  <div className="text-sm text-muted-foreground">R$ {offer.proposedValue?.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Prazo de Entrega</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(offer.needByDate).toLocaleDateString("pt-BR")}
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
              {offer.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {offer.status === "SENT" && (
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h2 className="text-xl font-semibold mb-4">Responder à Proposta</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Você pode aceitar esta proposta ou conversar com o agente para esclarecer dúvidas.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Aceitar Proposta
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
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
