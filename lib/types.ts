// Type definitions for Alimapa

export type UserRole = "GESTOR" | "INSTITUICAO" | "AGRICULTOR" | "EMPRESA"

export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEEDS_REVIEW"
  | "VALIDATED"
  | "ORCHESTRATING"
  | "PROPOSALS_SENT"
  | "FULFILLING"
  | "DELIVERED"
  | "CLOSED"
  | "CANCELLED"

export type OfferStatus = "DRAFTED" | "SENT" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "APPROVED" | "REJECTED"

export type ProgramType = "PNAE" | "PAA" | "OUTROS"

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5

export type CAFStatus = "ATIVO" | "PENDENTE" | "INATIVO"

export interface DemoSession {
  role: UserRole
  userId: string
}

export interface RequestItem {
  id: string
  productName: string
  quantity: number
  unit: string
}

export interface Request {
  id: string
  institutionId: string
  institutionName: string
  program: ProgramType
  status: RequestStatus
  urgency: UrgencyLevel
  needByDate: string
  items: RequestItem[]
  lat?: number
  lng?: number
  address?: string
  justification?: string
  createdAt: string
  updatedAt: string
  evidence?: Array<{
    id: string
    scope: string
    url: string
    kind?: string
    fileType?: string
    resourceType?: string
    originalName?: string
    sizeBytes?: number
    extractedText?: string
    extractionStatus?: string
    createdAt: string
  }>
}

export interface Farmer {
  id: string
  name: string
  products: string[]
  capacity?: string
  cafStatus: CAFStatus
  lat?: number
  lng?: number
  address?: string
  phone?: string
}

export interface Offer {
  id: string
  requestId: string
  farmerId: string
  farmerName: string
  status: OfferStatus
  items: RequestItem[]
  proposedValue?: number
  marketValue?: number
  distance?: number
  createdAt: string
}

export interface Credit {
  id: string
  requestId: string
  units: number
  type: string
  status: "DISPONIVEL" | "VENDIDO"
  municipalityId: string
  issuedAt: string
}

export interface Institution {
  id: string
  name: string
  type: string
  lat?: number
  lng?: number
  address?: string
  phone?: string
}

export interface AuditLog {
  id: string
  action: string
  actor: string
  entityType: string
  entityId: string
  timestamp: string
  details?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface AgentConfig {
  id: string
  farmerId: string
  farmerName: string
  type?: "NEGOTIATOR" | "VALIDATOR"
  personality: string
  objectives: string[]
  offerCalculation: "FIXED_PER_PRODUCT" | "CUSTOM_PER_FARMER"
  fixedDiscounts?: Record<string, number>
  customFormula?: string
  instructions?: string
  validatorConfig?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  farmerId: string
  farmerName: string
  agentConfigId: string
  messages: ChatMessage[]
  status: "ACTIVE" | "PAUSED" | "COMPLETED"
  unreadCount: number
  lastMessageAt: string
  createdAt: string
}

export interface ImpactCredit {
  id: string
  farmerId: string
  farmerName: string
  offerId: string
  requestId: string
  institutionId: string
  institutionName: string
  monetaryValue: number
  impactCredits: number
  unitType: string
  status: "DISPONIVEL" | "VENDIDO" | "RESERVADO"
  program: ProgramType
  backing: {
    requestId: string
    offerId: string
    farmerId: string
    deliveryConfirmedAt: string
    evidenceUrls?: string[]
  }
  createdAt: string
  updatedAt: string
  purchasedBy?: string
  purchasedAt?: string
}
