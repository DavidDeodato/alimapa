import { Badge } from "@/components/ui/badge"
import type { ProgramType } from "@/lib/types"
import { getProgramLabel, getProgramColor } from "@/lib/status-labels"

interface ProgramBadgeProps {
  program: ProgramType
}

export function ProgramBadge({ program }: ProgramBadgeProps) {
  return (
    <Badge variant="outline" className={getProgramColor(program)}>
      {getProgramLabel(program)}
    </Badge>
  )
}
