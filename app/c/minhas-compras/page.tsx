import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Download, ExternalLink } from "lucide-react"

export default async function MinhasComprasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "EMPRESA") redirect("/auth/login")

  const purchases = [
    {
      id: "pur-001",
      creditId: "cred-002",
      units: 100,
      type: "Kg de alimentos frescos",
      purchasedAt: "2025-01-11T10:00:00Z",
      status: "CONCLUIDO",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Minhas Compras</h1>
        <p className="text-muted-foreground mt-1">Histórico de créditos adquiridos</p>
      </div>

      {purchases.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {purchase.units} {purchase.type}
                      </h3>
                      <Badge variant="secondary">{purchase.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Adquirido em {new Date(purchase.purchasedAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/c/creditos/${purchase.creditId}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Certificado
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Você ainda não adquiriu nenhum crédito</p>
          <Button asChild className="mt-4">
            <Link href="/c/marketplace">Explorar Marketplace</Link>
          </Button>
        </Card>
      )}
    </div>
  )
}
