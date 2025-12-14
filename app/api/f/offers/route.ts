import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("AGRICULTOR")
  if (!auth.ok) return err(auth.error, 401)

  const farmer = await prisma.farmer.findFirst({ where: { userId: auth.user.id } })
  if (!farmer) return err("Agricultor não encontrado para este usuário", 404)

  const offers = await prisma.offer.findMany({
    where: { farmerId: farmer.id },
    include: {
      items: true,
      request: { include: { institution: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const offerIds = offers.map((o) => o.id)
  const conversations = offerIds.length
    ? await prisma.conversation.findMany({
        where: { offerId: { in: offerIds } },
        include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      })
    : []
  const convByOfferId = new Map(conversations.map((c) => [c.offerId, c]))

  return ok({
    offers: offers.map((o) => {
      const conv = convByOfferId.get(o.id)
      return {
        id: o.id,
        requestId: o.requestId,
        farmerId: o.farmerId,
        farmerName: farmer.name,
        status: o.status,
        items: o.items.map((it) => ({
          id: it.id,
          productName: it.productName,
          quantity: Number(it.quantity),
          unit: it.unit,
        })),
        proposedValue: o.proposedValue ?? undefined,
        marketValue: o.marketValue ?? undefined,
        distance: o.distanceKm ?? undefined,
        institutionName: o.request.institution.name,
        needByDate: o.request.needByDate.toISOString(),
        conversationId: conv?.id ?? undefined,
        lastMessagePreview: conv?.messages?.[0]?.content ?? undefined,
        lastMessageAt: conv?.messages?.[0]?.createdAt ? conv.messages[0].createdAt.toISOString() : undefined,
        createdAt: o.createdAt.toISOString(),
      }
    }),
  })
}


