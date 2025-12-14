import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"

export default async function DocumentosPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "AGRICULTOR") redirect("/auth/login")

  const documents = [
    {
      id: "doc-001",
      name: "DAP - Declaração de Aptidão ao PRONAF",
      type: "PDF",
      date: "2024-12-01",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meus Documentos</h1>
        <p className="text-muted-foreground mt-1">Documentos gerados e anexados</p>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <div className="font-semibold mb-1">{doc.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {doc.type} • {new Date(doc.date).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum documento disponível no momento</p>
        </Card>
      )}
    </div>
  )
}
