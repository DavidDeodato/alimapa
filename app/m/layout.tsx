import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Map, FileText, Users, Shield, Coins, Bot, MessageSquare } from "lucide-react"

export default async function GestorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "GESTOR") redirect("/auth/login")

  const navItems = [
    { href: "/m/painel", icon: Map, label: "Painel Territorial" },
    { href: "/m/requisicoes", icon: FileText, label: "Requisições" },
    { href: "/m/agricultores", icon: Users, label: "Agricultores" },
    { href: "/m/agents", icon: Bot, label: "Agentes IA" },
    { href: "/m/conversas", icon: MessageSquare, label: "Conversas" },
    { href: "/m/auditoria", icon: Shield, label: "Auditoria" },
    { href: "/m/creditos", icon: Coins, label: "Créditos" },
  ]

  return (
    <AuthLayout
      role={(session.user as any).role}
      userName={session.user.name}
      avatarUrl={(session.user as any).avatarUrl}
      sidebar={
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group transition-colors"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      }
    >
      {children}
    </AuthLayout>
  )
}
