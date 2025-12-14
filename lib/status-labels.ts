import type { RequestStatus, OfferStatus, ProgramType, UrgencyLevel } from "./types"

export function getRequestStatusLabel(status: RequestStatus): string {
  const labels: Record<RequestStatus, string> = {
    DRAFT: "Rascunho",
    SUBMITTED: "Enviada",
    NEEDS_REVIEW: "Precisa de revisão",
    VALIDATED: "Validada",
    ORCHESTRATING: "Orquestrando",
    PROPOSALS_SENT: "Propostas enviadas",
    FULFILLING: "Em atendimento",
    DELIVERED: "Entregue",
    CLOSED: "Concluída",
    CANCELLED: "Cancelada",
  }
  return labels[status]
}

export function getOfferStatusLabel(status: OfferStatus): string {
  const labels: Record<OfferStatus, string> = {
    DRAFTED: "Rascunho",
    SENT: "Enviada ao agricultor",
    ACCEPTED: "Aceita pelo agricultor",
    DECLINED: "Recusada",
    EXPIRED: "Expirada",
    APPROVED: "Aprovada pelo município",
    REJECTED: "Rejeitada",
  }
  return labels[status]
}

export function getProgramLabel(program: ProgramType): string {
  const labels: Record<ProgramType, string> = {
    PNAE: "PNAE",
    PAA: "PAA",
    OUTROS: "Outros",
  }
  return labels[program]
}

export function getUrgencyLabel(urgency: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    1: "Muito Baixa",
    2: "Baixa",
    3: "Média",
    4: "Alta",
    5: "Crítica",
  }
  return labels[urgency]
}

export function getRequestStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
    SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
    NEEDS_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
    VALIDATED: "bg-green-100 text-green-800 border-green-200",
    ORCHESTRATING: "bg-purple-100 text-purple-800 border-purple-200",
    PROPOSALS_SENT: "bg-indigo-100 text-indigo-800 border-indigo-200",
    FULFILLING: "bg-cyan-100 text-cyan-800 border-cyan-200",
    DELIVERED: "bg-teal-100 text-teal-800 border-teal-200",
    CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[status]
}

export function getOfferStatusColor(status: OfferStatus): string {
  const colors: Record<OfferStatus, string> = {
    DRAFTED: "bg-gray-100 text-gray-800 border-gray-200",
    SENT: "bg-blue-100 text-blue-800 border-blue-200",
    ACCEPTED: "bg-green-100 text-green-800 border-green-200",
    DECLINED: "bg-red-100 text-red-800 border-red-200",
    EXPIRED: "bg-gray-100 text-gray-800 border-gray-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[status]
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    1: "bg-gray-100 text-gray-800 border-gray-200",
    2: "bg-blue-100 text-blue-800 border-blue-200",
    3: "bg-yellow-100 text-yellow-800 border-yellow-200",
    4: "bg-orange-100 text-orange-800 border-orange-200",
    5: "bg-red-100 text-red-800 border-red-200",
  }
  return colors[urgency]
}

export function getProgramColor(program: ProgramType): string {
  const colors: Record<ProgramType, string> = {
    PNAE: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PAA: "bg-blue-100 text-blue-800 border-blue-200",
    OUTROS: "bg-gray-100 text-gray-800 border-gray-200",
  }
  return colors[program]
}
