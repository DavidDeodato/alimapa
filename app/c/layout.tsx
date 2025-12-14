import type React from "react"
import { redirect } from "next/navigation"
import { getDemoSession } from "@/lib/demo-session"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Store, ShoppingBag } from "lucide-react"

export default async function EmpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getDemoSession()

  if (!session || session.role !== "EMPRESA") {
    redirect("/demo")
  }

  const navItems = [
    { href: "/c/marketplace", icon: Store, label: "Marketplace" },
    { href: "/c/minhas-compras", icon: ShoppingBag, label: "Minhas Compras" },
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
