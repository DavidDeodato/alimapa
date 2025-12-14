import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Package } from "lucide-react"
import type { Farmer } from "@/lib/types"

export default async function AgricultoresPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  const farmers: Farmer[] = [
    {
      id: "farm-001",
      name: "João da Silva",
      products: ["Alface", "Tomate", "Cenoura"],
      capacity: "200 kg/semana",
      cafStatus: "ATIVO",
      address: "Sítio Boa Vista, Zona Rural",
      phone: "(61) 98765-4321",
    },
    {
      id: "farm-002",
      name: "Maria Santos",
      products: ["Banana", "Mamão", "Abóbora"],
      capacity: "150 kg/semana",
      cafStatus: "ATIVO",
      address: "Chácara Sol Nascente, KM 15",
      phone: "(61) 99876-5432",
    },
    {
      id: "farm-003",
      name: "Pedro Oliveira",
      products: ["Batata", "Mandioca", "Milho"],
      capacity: "300 kg/semana",
      cafStatus: "PENDENTE",
      address: "Fazenda Santa Rita, Zona Rural",
      phone: "(61) 97654-3210",
    },
  ]

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
            <Input placeholder="Buscar por nome ou produto..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmers.map((farmer) => (
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
                      <div className="text-muted-foreground">{farmer.address}</div>
                    </div>
                  </div>

                  {farmer.capacity && <div className="text-muted-foreground">Capacidade: {farmer.capacity}</div>}
                </div>

                <Button asChild size="sm" className="w-full bg-transparent" variant="outline">
                  <Link href={`/m/agricultores/${farmer.id}`}>Ver Perfil</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  )
}
