"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SidebarNavItemProps {
  href: string
  icon: LucideIcon
  label: string
  badge?: number
  isCollapsed?: boolean
}

export function SidebarNavItem({ href, icon: Icon, label, badge, isCollapsed }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link href={href} className="block">
      <Button
        variant="ghost"
        className={cn(
          "w-full gap-3 h-12 px-4 hover:bg-primary/10 hover:text-primary group transition-all",
          isActive && "bg-primary/10 text-primary",
          isCollapsed ? "justify-center px-2" : "justify-start",
        )}
        title={isCollapsed ? label : undefined}
      >
        <Icon
          className={cn(
            "h-5 w-5 flex-shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
          )}
        />
        {!isCollapsed && (
          <>
            <span className="font-medium truncate flex-1 text-left">{label}</span>
            {badge && badge > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 rounded-full text-xs px-1.5 animate-pulse">
                {badge}
              </Badge>
            )}
          </>
        )}
        {isCollapsed && badge && badge > 0 && (
          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
        )}
      </Button>
    </Link>
  )
}
