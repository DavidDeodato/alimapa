"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Building2, School, Sprout, Factory } from "lucide-react"
import type { UserRole } from "@/lib/types"

const roles: Array<{ role: UserRole; title: string; description: string; icon: React.ReactNode }> = [
  {
    role: "GESTOR",
    title: "Gestor Municipal",
    description: "Coordenar a cadeia de segurança alimentar do território",
    icon: <Building2 className="h-8 w-8" />,
  },
  {
    role: "INSTITUICAO",
    title: "Instituição (Escola/ONG)",
    description: "Solicitar alimentos para programas institucionais",
    icon: <School className="h-8 w-8" />,
  },
  {
    role: "AGRICULTOR",
    title: "Agricultor Familiar",
    description: "Receber propostas e vender créditos de impacto",
    icon: <Sprout className="h-8 w-8" />,
  },
  {
    role: "EMPRESA",
    title: "Empresa (Créditos de Impacto)",
    description: "Adquirir créditos lastreados em entregas reais",
    icon: <Factory className="h-8 w-8" />,
  },
]

export default function DemoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<UserRole | null>(null)

  const handleSelectRole = async (role: UserRole) => {
    setLoading(role)
    try {
      const response = await fetch("/api/demo/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error("Falha ao iniciar sessão")
      }

      const redirectPaths: Record<UserRole, string> = {
        GESTOR: "/m/painel",
        INSTITUICAO: "/i/requisicoes",
        AGRICULTOR: "/f/propostas",
        EMPRESA: "/c/marketplace",
      }

      router.push(redirectPaths[role])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível iniciar a sessão de demonstração.",
      })
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-12">
        <div className="text-center space-y-6">
          <Image src="/alimap.png" alt="Alimapa" width={240} height={64} className="h-16 w-auto mx-auto" />
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Bem-vindo ao Alimapa
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Demonstração do fluxo completo da cadeia de segurança alimentar no território. Selecione um perfil para
              explorar a plataforma.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {roles.map(({ role, title, description, icon }) => (
            <Card
              key={role}
              className="card-elevated hover:shadow-lg hover:border-primary/30 cursor-pointer group transition-all duration-300"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleSelectRole(role)}
                  disabled={loading !== null}
                  className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                >
                  {loading === role ? "Carregando..." : "Acessar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
