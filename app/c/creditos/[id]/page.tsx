import { getDemoSession } from "@/lib/demo-session"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, CheckCircle2, FileText, ImageIcon } from "lucide-react"
import Link from "next/link"

export default async function CreditDetailPage({ params }: { params: { id: string } }) {
  const session = await getDemoSession()
  if (!session || session.role !== "EMPRESA") {
    redirect("/demo")
  }

  const { id } = params

  const credit = {
    id,
    requestId: "req-001",
    units: 500,
    type: "Refeições escolares",
    status: "DISPONIVEL" as const,
    municipalityId: "mun-001",
    municipalityName: "Município de Brasília",
    issuedAt: "2025-01-12T10:00:00Z",
  }

  const timeline = [
    { action: "Requisição criada", timestamp: "2025-01-10T10:00:00Z", status: "completed" },
    { action: "Validada pelo município", timestamp: "2025-01-11T09:00:00Z", status: "completed" },
    { action: "Orquestração executada", timestamp: "2025-01-11T09:05:00Z", status: "completed" },
    { action: "Proposta aprovada", timestamp: "2025-01-11T14:00:00Z", status: "completed" },
    { action: "Entrega confirmada", timestamp: "2025-01-12T09:00:00Z", status: "completed" },
    { action: "Crédito emitido", timestamp: "2025-01-12T10:00:00Z", status: "completed" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Crédito de Impacto</h1>
            <Badge variant="default">Disponível</Badge>
          </div>
          <p className="text-muted-foreground">{credit.municipalityName}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/c/marketplace">Voltar</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Resumo do Crédito
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-4xl font-bold">{credit.units}</div>
                <div className="text-lg text-muted-foreground">{credit.type}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Território</div>
                  <div className="text-muted-foreground">{credit.municipalityName}</div>
                </div>
                <div>
                  <div className="font-medium">Emissão</div>
                  <div className="text-muted-foreground">{new Date(credit.issuedAt).toLocaleDateString("pt-BR")}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Lastro - Linha do Tempo
            </h2>
            <div className="space-y-4">
              {timeline.map((event, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    {idx < timeline.length - 1 && <div className="h-full w-px bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="text-sm font-medium">{event.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Evidências
            </h2>
            <p className="text-sm text-muted-foreground">Nenhuma evidência fotográfica anexada</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Adquirir Crédito</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Este crédito está lastreado em uma entrega real e verificada no território.
            </p>
            <Button className="w-full mb-3">Comprar Crédito</Button>
            <Button variant="outline" asChild className="w-full bg-transparent">
              <Link href={`/m/requisicoes/${credit.requestId}`}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Requisição Original
              </Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Certificação</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Após a compra, você receberá um certificado digital comprovando o impacto social.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
