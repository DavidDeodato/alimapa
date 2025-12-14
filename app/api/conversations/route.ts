import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return err("Não autenticado.", 401)

  const role = (session.user as any).role as string | undefined
  const userId = (session.user as any).id as string | undefined
  const municipalityId = (session.user as any).municipalityId as string | undefined

  if (!role || !userId) return err("Sessão inválida.", 401)

  if (role === "AGRICULTOR") {
    const farmer = await prisma.farmer.findUnique({ where: { userId } })
    if (!farmer) return ok({ conversations: [] })

    const conversations = await prisma.conversation.findMany({
      where: { farmerId: farmer.id },
      orderBy: { lastMessageAt: "desc" },
      include: {
        farmer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    })

    return ok({
      conversations: conversations.map((c) => ({
        id: c.id,
        offerId: c.offerId,
        farmerId: c.farmerId,
        farmerName: c.farmer.name,
        status: c.status,
        unreadCount: c.unreadFarmer,
        lastMessageAt: (c.lastMessageAt ?? c.updatedAt).toISOString(),
        lastMessagePreview: c.messages[0]?.content ?? "",
      })),
    })
  }

  if (role === "GESTOR") {
    if (!municipalityId) return err("Gestor sem município associado.", 400)

    const conversations = await prisma.conversation.findMany({
      where: {
        offer: {
          request: { municipalityId },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        farmer: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    })

    return ok({
      conversations: conversations.map((c) => ({
        id: c.id,
        offerId: c.offerId,
        farmerId: c.farmerId,
        farmerName: c.farmer.name,
        status: c.status,
        unreadCount: c.unreadManager,
        lastMessageAt: (c.lastMessageAt ?? c.updatedAt).toISOString(),
        lastMessagePreview: c.messages[0]?.content ?? "",
      })),
    })
  }

  return err("Perfil sem acesso a conversas.", 403)
}



