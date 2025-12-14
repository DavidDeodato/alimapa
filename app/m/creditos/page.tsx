import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, ExternalLink } from "lucide-react"
import type { Credit } from "@/lib/types"

export default async function CreditosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  const credits: Credit[] = [
    {
      id: "cred-001",
      requestId: "req-001",
      units: 500,
      type: "Refeições escolares",
      status: "DISPONIVEL",
      municipalityId: "mun-001",
      issuedAt: "2025-01-12T10:00:00Z",
    },
    {
      id: "cred-002",
      requestId: "req-002",
      units: 100,
      type: "Kg de alimentos frescos",
      status: "VENDIDO",
      municipalityId: "mun-001",
      issuedAt: "2025-01-10T14:00:00Z",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Créditos de Impacto</h1>
          <p className="text-muted-foreground mt-1">Créditos emitidos pelo território</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credits.map((credit) => (
          <Card key={credit.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <Badge variant={credit.status === "DISPONIVEL" ? "default" : "secondary"}>
                  {credit.status === "DISPONIVEL" ? "Disponível" : "Vendido"}
                </Badge>
              </div>

              <div>
                <div className="text-3xl font-bold">{credit.units}</div>
                <div className="text-sm text-muted-foreground">{credit.type}</div>
              </div>

              <div className="text-xs text-muted-foreground">
                Emitido em {new Date(credit.issuedAt).toLocaleDateString("pt-BR")}
              </div>

              <Button asChild size="sm" variant="outline" className="w-full bg-transparent">
                <Link href={`/m/requisicoes/${credit.requestId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver Requisição
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
