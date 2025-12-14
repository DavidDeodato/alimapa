import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { ProgramBadge } from "@/components/program-badge"
import { UrgencyBadge } from "@/components/urgency-badge"
import { Search, Filter } from "lucide-react"
import type { Request } from "@/lib/types"

export default async function RequisicoesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  // Mock data - replace with API call
  const requests: Request[] = [
    {
      id: "req-001",
      institutionId: "inst-001",
      institutionName: "Escola Municipal João Paulo II",
      program: "PNAE",
      status: "SUBMITTED",
      urgency: 4,
      needByDate: "2025-01-20",
      items: [
        { id: "1", productName: "Alface", quantity: 50, unit: "kg" },
        { id: "2", productName: "Tomate", quantity: 30, unit: "kg" },
      ],
      address: "Rua das Flores, 123",
      createdAt: "2025-01-10T10:00:00Z",
      updatedAt: "2025-01-10T10:00:00Z",
    },
    {
      id: "req-002",
      institutionId: "inst-002",
      institutionName: "Creche Municipal Pequenos Sonhos",
      program: "PNAE",
      status: "VALIDATED",
      urgency: 3,
      needByDate: "2025-01-25",
      items: [{ id: "3", productName: "Banana", quantity: 100, unit: "kg" }],
      address: "Av. Central, 456",
      createdAt: "2025-01-08T14:00:00Z",
      updatedAt: "2025-01-11T09:00:00Z",
    },
    {
      id: "req-003",
      institutionId: "inst-003",
      institutionName: "Hospital Municipal",
      program: "PAA",
      status: "FULFILLING",
      urgency: 5,
      needByDate: "2025-01-15",
      items: [
        { id: "4", productName: "Cenoura", quantity: 80, unit: "kg" },
        { id: "5", productName: "Batata", quantity: 120, unit: "kg" },
      ],
      address: "Praça da Saúde, 789",
      createdAt: "2025-01-05T08:00:00Z",
      updatedAt: "2025-01-12T16:00:00Z",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Requisições
          </h1>
          <p className="text-muted-foreground text-lg">Gerencie todas as requisições do território</p>
        </div>
      </div>

      <Card className="card-elevated p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar por instituição..." className="pl-10 h-11" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="SUBMITTED">Enviada</SelectItem>
              <SelectItem value="VALIDATED">Validada</SelectItem>
              <SelectItem value="FULFILLING">Em atendimento</SelectItem>
              <SelectItem value="CLOSED">Concluída</SelectItem>
            </SelectContent>
          </Select>
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
          <Button variant="outline" size="icon" className="h-11 w-11 bg-transparent">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Instituição</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Programa</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Urgência</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Prazo</th>
                <th className="text-left p-4 font-semibold text-sm text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold">{request.institutionName}</div>
                    <div className="text-sm text-muted-foreground mt-1">{request.address}</div>
                  </td>
                  <td className="p-4">
                    <ProgramBadge program={request.program} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="p-4">
                    <UrgencyBadge level={request.urgency} />
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{new Date(request.needByDate).toLocaleDateString("pt-BR")}</div>
                  </td>
                  <td className="p-4">
                    <Button asChild size="sm" className="bg-gradient-to-r from-primary to-secondary">
                      <Link href={`/m/requisicoes/${request.id}`}>Abrir</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
