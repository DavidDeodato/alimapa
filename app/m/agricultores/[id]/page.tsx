import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Package, Phone, FileText } from "lucide-react"
import Link from "next/link"

export default async function FarmerDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  const { id } = params

  const farmer = {
    id,
    name: "João da Silva",
    products: ["Alface", "Tomate", "Cenoura"],
    capacity: "200 kg/semana",
    cafStatus: "ATIVO" as const,
    address: "Sítio Boa Vista, Zona Rural",
    phone: "(61) 98765-4321",
    lat: -15.78,
    lng: -47.93,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{farmer.name}</h1>
            <Badge variant={farmer.cafStatus === "ATIVO" ? "default" : "secondary"}>CAF {farmer.cafStatus}</Badge>
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
                <div className="text-sm text-muted-foreground">{farmer.address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Telefone</div>
                <div className="text-sm text-muted-foreground">{farmer.phone}</div>
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
                {farmer.products.map((product) => (
                  <Badge key={product} variant="outline">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Capacidade de Produção</div>
              <div className="text-sm text-muted-foreground">{farmer.capacity}</div>
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
