import type React from "react"
import { redirect } from "next/navigation"
import { getDemoSession } from "@/lib/demo-session"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

export default async function InstituicaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getDemoSession()

  if (!session || session.role !== "INSTITUICAO") {
    redirect("/demo")
  }

  const navItems = [
    { href: "/i/requisicoes", icon: FileText, label: "Minhas Requisições" },
    { href: "/i/nova-requisicao", icon: Plus, label: "Nova Requisição" },
  ]

  return (
    <AuthLayout
      role={session.role}
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
