import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, User, Calendar } from "lucide-react"
import type { AuditLog } from "@/lib/types"

export default async function AuditoriaPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  const logs: AuditLog[] = [
    {
      id: "log-001",
      action: "Requisição criada",
      actor: "Escola Municipal João Paulo II",
      entityType: "Request",
      entityId: "req-001",
      timestamp: "2025-01-10T10:00:00Z",
      details: "Criação de nova requisição PNAE",
    },
    {
      id: "log-002",
      action: "Requisição validada",
      actor: "Gestor Municipal",
      entityType: "Request",
      entityId: "req-001",
      timestamp: "2025-01-11T09:00:00Z",
      details: "Requisição aprovada para orquestração",
    },
    {
      id: "log-003",
      action: "Orquestração executada",
      actor: "Sistema",
      entityType: "Request",
      entityId: "req-001",
      timestamp: "2025-01-11T09:05:00Z",
      details: "3 propostas geradas",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Auditoria</h1>
          <p className="text-muted-foreground mt-1">Registro completo de ações no sistema</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <Select defaultValue="all">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="create">Criação</SelectItem>
              <SelectItem value="update">Atualização</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground mt-1">{log.details}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {log.actor}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {log.entityType} #{log.entityId}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
