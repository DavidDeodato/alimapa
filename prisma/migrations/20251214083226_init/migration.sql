-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GESTOR', 'INSTITUICAO', 'AGRICULTOR', 'EMPRESA');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_REVIEW', 'VALIDATED', 'ORCHESTRATING', 'PROPOSALS_SENT', 'FULFILLING', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFTED', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('PNAE', 'PAA', 'OUTROS');

-- CreateEnum
CREATE TYPE "CAFStatus" AS ENUM ('ATIVO', 'PENDENTE', 'INATIVO');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ImpactCreditStatus" AS ENUM ('DISPONIVEL', 'VENDIDO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "SenderRole" AS ENUM ('FARMER', 'ASSISTANT', 'MANAGER', 'SYSTEM');

-- CreateTable
CREATE TABLE "Municipality" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "displayName" TEXT NOT NULL,
    "municipalityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farmer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "municipalityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "products" TEXT[],
    "capacity" TEXT,
    "cafStatus" "CAFStatus" NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farmer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "municipalityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "program" "ProgramType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "urgency" INTEGER NOT NULL,
    "needByDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestItem" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFTED',
    "proposedValue" DOUBLE PRECISION,
    "marketValue" DOUBLE PRECISION,
    "distanceKm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferItem" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "OfferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentConfig" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "farmerId" TEXT,
    "farmerName" TEXT,
    "personality" TEXT NOT NULL,
    "objectives" TEXT[],
    "offerCalculation" TEXT NOT NULL,
    "fixedDiscounts" JSONB,
    "customFormula" TEXT,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "startedByUserId" TEXT,
    "status" TEXT NOT NULL,
    "explainability" JSONB,
    "createdOffers" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "agentConfigId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "unreadFarmer" INTEGER NOT NULL DEFAULT 0,
    "unreadManager" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" "SenderRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryConfirmation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DeliveryConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactCredit" (
    "id" TEXT NOT NULL,
    "municipalityId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "monetaryValue" DOUBLE PRECISION NOT NULL,
    "impactCredits" INTEGER NOT NULL,
    "unitType" TEXT NOT NULL,
    "status" "ImpactCreditStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "program" "ProgramType" NOT NULL,
    "backing" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "purchasedByCompanyId" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "listedAt" TIMESTAMP(3),

    CONSTRAINT "ImpactCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_userId_key" ON "Farmer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_userId_key" ON "Institution"("userId");

-- CreateIndex
CREATE INDEX "AgentConfig_municipalityId_idx" ON "AgentConfig"("municipalityId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_offerId_key" ON "Conversation"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryConfirmation_requestId_key" ON "DeliveryConfirmation"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farmer" ADD CONSTRAINT "Farmer_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Institution" ADD CONSTRAINT "Institution_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestItem" ADD CONSTRAINT "RequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferItem" ADD CONSTRAINT "OfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentConfig" ADD CONSTRAINT "AgentConfig_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentConfig" ADD CONSTRAINT "AgentConfig_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentConfigId_fkey" FOREIGN KEY ("agentConfigId") REFERENCES "AgentConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryConfirmation" ADD CONSTRAINT "DeliveryConfirmation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_municipalityId_fkey" FOREIGN KEY ("municipalityId") REFERENCES "Municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "Farmer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactCredit" ADD CONSTRAINT "ImpactCredit_purchasedByCompanyId_fkey" FOREIGN KEY ("purchasedByCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
