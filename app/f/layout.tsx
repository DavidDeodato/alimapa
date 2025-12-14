import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { FileText, FolderOpen, Store, MessageCircle } from "lucide-react"

export default async function AgricultorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "AGRICULTOR") redirect("/auth/login")
  const unreadCount = 0

  const navItems = [
    { href: "/f/propostas", icon: FileText, label: "Propostas", badge: 0 },
    { href: "/f/chat", icon: MessageCircle, label: "Chat", badge: unreadCount },
    { href: "/f/meus-creditos", icon: Store, label: "Meus Créditos", badge: 0 },
    { href: "/f/documentos", icon: FolderOpen, label: "Documentos", badge: 0 },
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
                className="w-full justify-start gap-3 h-12 px-4 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group transition-colors relative"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
                {item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 min-w-5 rounded-full text-xs px-1.5 animate-pulse"
                  >
                    {item.badge}
                  </Badge>
                )}
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
