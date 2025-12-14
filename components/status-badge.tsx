import { Badge } from "@/components/ui/badge"
import type { RequestStatus, OfferStatus } from "@/lib/types"
import {
  getRequestStatusLabel,
  getRequestStatusColor,
  getOfferStatusLabel,
  getOfferStatusColor,
} from "@/lib/status-labels"

interface StatusBadgeProps {
  status: RequestStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={getRequestStatusColor(status)}>
      {getRequestStatusLabel(status)}
    </Badge>
  )
}

interface RequestStatusBadgeProps {
  status: RequestStatus
}

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getRequestStatusColor(status)}>
      {getRequestStatusLabel(status)}
    </Badge>
  )
}

interface OfferStatusBadgeProps {
  status: OfferStatus
}

export function OfferStatusBadge({ status }: OfferStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getOfferStatusColor(status)}>
      {getOfferStatusLabel(status)}
    </Badge>
  )
}
