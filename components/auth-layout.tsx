"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getRoleLabel } from "@/lib/demo-session"
import type { UserRole } from "@/lib/types"
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  role: UserRole
  sidebar: React.ReactNode
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function AuthLayout({
  children,
  role,
  sidebar,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
}: AuthLayoutProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const setIsCollapsed = onCollapsedChange || setInternalCollapsed

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "border-r bg-gradient-to-b from-card to-muted/20 backdrop-blur-sm flex flex-col transition-all duration-300 ease-in-out",
          "hidden md:flex",
          isCollapsed ? "w-20" : "w-72",
        )}
      >
        {/* Logo and collapse button */}
        <div
          className={cn(
            "p-4 border-b border-border/50 flex items-center gap-2 min-h-[73px]",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          {!isCollapsed && (
            <Link href="/demo" className="flex items-center gap-3 flex-shrink-0">
              <Image src="/alimap.png" alt="Alimapa" width={140} height={36} className="h-9 w-auto" />
            </Link>
          )}
          {isCollapsed && (
            <Link href="/demo" className="flex items-center justify-center">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "flex-shrink-0 h-9 w-9 hover:bg-primary/10",
              isCollapsed && "absolute top-4 -right-3 bg-card border shadow-md z-10",
            )}
            title={isCollapsed ? "Expandir" : "Recolher"}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className={cn("space-y-2", isCollapsed && "space-y-3")}>{sidebar}</div>
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl transform transition-transform duration-300 md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex items-center justify-between">
            <Image src="/alimap.png" alt="Alimapa" width={140} height={36} className="h-9 w-auto" />
            <Button variant="ghost" size="sm" onClick={() => setIsMobileOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">{sidebar}</div>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-gradient-to-r from-card via-card to-muted/10 backdrop-blur-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Alimapa
                </h1>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium px-3 py-1">
                  {getRoleLabel(role)}
                </Badge>
              </div>
            </div>
            <Link href="/demo">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                Trocar perfil
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/10">
          {children}
        </main>
      </div>
    </div>
  )
}
