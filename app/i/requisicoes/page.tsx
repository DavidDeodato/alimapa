import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { Plus, Calendar } from "lucide-react"
import type { Request } from "@/lib/types"

export default async function InstituicaoRequisicoesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "INSTITUICAO") redirect("/auth/login")

  const requests: Request[] = [
    {
      id: "req-001",
      institutionId: "inst-001",
      institutionName: "Escola Municipal João Paulo II",
      program: "PNAE",
      status: "FULFILLING",
      urgency: 4,
      needByDate: "2025-01-20",
      items: [
        { id: "1", productName: "Alface", quantity: 50, unit: "kg" },
        { id: "2", productName: "Tomate", quantity: 30, unit: "kg" },
      ],
      createdAt: "2025-01-10T10:00:00Z",
      updatedAt: "2025-01-12T16:00:00Z",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Minhas Requisições</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas solicitações de alimentos</p>
        </div>
        <Button asChild>
          <Link href="/i/nova-requisicao">
            <Plus className="h-4 w-4 mr-2" />
            Nova Requisição
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-lg font-semibold">Requisição #{request.id}</h3>
                  <StatusBadge status={request.status} />
                  <ProgramBadge program={request.program} />
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Prazo: {new Date(request.needByDate).toLocaleDateString("pt-BR")}
                  </div>
                  <div>Itens: {request.items.map((i) => i.productName).join(", ")}</div>
                </div>
              </div>

              <Button asChild size="sm">
                <Link href={`/i/requisicoes/${request.id}`}>Abrir</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
