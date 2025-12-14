"use client"

import type React from "react"
import { AuthLayout } from "@/components/auth-layout"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, User, FolderOpen, Store, MessageCircle } from "lucide-react"
import { useState, useEffect } from "react"

export default function AgricultorLayout({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(1)

  useEffect(() => {
    // Simulate checking for unread messages
    const checkUnread = () => {
      // In a real app, this would fetch from an API
      setUnreadCount(1)
    }
    checkUnread()
    const interval = setInterval(checkUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: "/f/propostas", icon: FileText, label: "Propostas", badge: 0 },
    { href: "/f/chat", icon: MessageCircle, label: "Chat", badge: unreadCount },
    { href: "/f/meus-creditos", icon: Store, label: "Meus Créditos", badge: 0 },
    { href: "/f/perfil", icon: User, label: "Perfil", badge: 0 },
    { href: "/f/documentos", icon: FolderOpen, label: "Documentos", badge: 0 },
  ]

  return (
    <AuthLayout
      role="AGRICULTOR"
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
