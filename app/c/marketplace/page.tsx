import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Award, ExternalLink, User, Package, MapPin, TrendingUp } from "lucide-react"
import type { ImpactCredit } from "@/lib/types"
import { ProgramBadge } from "@/components/program-badge"

export default async function MarketplacePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "EMPRESA") redirect("/auth/login")

  const credits: ImpactCredit[] = [
    {
      id: "cred-001",
      farmerId: "farm-001",
      farmerName: "João da Silva",
      offerId: "off-001",
      requestId: "req-001",
      institutionId: "inst-001",
      institutionName: "Escola Municipal João Paulo II",
      monetaryValue: 450,
      impactCredits: 50,
      unitType: "Refeições escolares",
      status: "DISPONIVEL",
      program: "PNAE",
      backing: {
        requestId: "req-001",
        offerId: "off-001",
        farmerId: "farm-001",
        deliveryConfirmedAt: "2025-01-12T10:00:00Z",
      },
      createdAt: "2025-01-12T10:00:00Z",
      updatedAt: "2025-01-12T10:00:00Z",
    },
    {
      id: "cred-002",
      farmerId: "farm-002",
      farmerName: "Maria Santos",
      offerId: "off-002",
      requestId: "req-002",
      institutionId: "inst-002",
      institutionName: "Creche Municipal Pequenos Sonhos",
      monetaryValue: 800,
      impactCredits: 100,
      unitType: "Kg de alimentos orgânicos",
      status: "DISPONIVEL",
      program: "PNAE",
      backing: {
        requestId: "req-002",
        offerId: "off-002",
        farmerId: "farm-002",
        deliveryConfirmedAt: "2025-01-13T14:00:00Z",
      },
      createdAt: "2025-01-13T14:00:00Z",
      updatedAt: "2025-01-13T14:00:00Z",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          Marketplace de Créditos de Impacto
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Créditos lastreados em entregas reais de agricultores familiares no território
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="card-elevated gradient-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Créditos Disponíveis</CardTitle>
            <Award className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{credits.length}</div>
            <p className="text-xs text-muted-foreground mt-1">prontos para compra</p>
          </CardContent>
        </Card>

        <Card className="card-elevated gradient-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Impacto</CardTitle>
            <TrendingUp className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{credits.reduce((sum, c) => sum + c.impactCredits, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">créditos de impacto</p>
          </CardContent>
        </Card>

        <Card className="card-elevated gradient-subtle">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agricultores</CardTitle>
            <User className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{new Set(credits.map((c) => c.farmerId)).size}</div>
            <p className="text-xs text-muted-foreground mt-1">vendendo créditos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elevated p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar por agricultor ou instituição..." className="pl-10 h-11" />
          </div>
          <Select defaultValue="all">
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
          <Select defaultValue="available">
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponível</SelectItem>
              <SelectItem value="sold">Vendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {credits.map((credit) => (
          <Card key={credit.id} className="card-elevated hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-6 space-y-4">
              {/* Header com ícone e badge */}
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-7 w-7 text-primary" />
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20 font-medium">Disponível</Badge>
              </div>

              {/* Valor dos créditos */}
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {credit.impactCredits}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{credit.unitType}</div>
              </div>

              {/* Informações do agricultor e lastro */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Agricultor:</span>
                  <span className="font-semibold">{credit.farmerName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Instituição:</span>
                  <span className="font-medium text-xs">{credit.institutionName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Programa:</span>
                  <ProgramBadge program={credit.program} />
                </div>
              </div>

              {/* Valor monetário */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Valor do Lastro</div>
                <div className="text-xl font-bold text-primary">
                  {credit.monetaryValue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </div>

              {/* Data de emissão */}
              <div className="text-xs text-muted-foreground">
                Emitido em {new Date(credit.createdAt).toLocaleDateString("pt-BR")}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                  <Link href={`/c/creditos/${credit.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver Lastro
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-primary to-secondary">
                  <Link href={`/c/creditos/${credit.id}`}>Comprar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
