import { Badge } from "@/components/ui/badge"
import type { UrgencyLevel } from "@/lib/types"
import { getUrgencyLabel, getUrgencyColor } from "@/lib/status-labels"

interface UrgencyBadgeProps {
  level: UrgencyLevel
}

export function UrgencyBadge({ level }: UrgencyBadgeProps) {
  return (
    <Badge variant="outline" className={getUrgencyColor(level)}>
      {getUrgencyLabel(level)}
    </Badge>
  )
}
