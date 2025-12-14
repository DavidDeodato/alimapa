import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Oferta inválida.", 400)
  const session = await getServerSession(authOptions)
  if (!session?.user) return err("Não autenticado.", 401)

  const role = (session.user as any).role as string | undefined
  const userId = (session.user as any).id as string | undefined
  const municipalityId = (session.user as any).municipalityId as string | undefined
  if (!role || !userId) return err("Sessão inválida.", 401)

  const conversation = await prisma.conversation.findUnique({
    where: { offerId: id },
    include: { farmer: true, offer: { include: { request: true } } },
  })
  if (!conversation) return err("Conversa não encontrada para esta proposta.", 404)

  if (role === "AGRICULTOR") {
    if (conversation.farmer.userId !== userId) return err("Acesso negado.", 403)
    return ok({ conversationId: conversation.id })
  }

  if (role === "GESTOR") {
    if (!municipalityId) return err("Gestor sem município associado.", 400)
    if (conversation.offer.request.municipalityId !== municipalityId) return err("Acesso negado.", 403)
    return ok({ conversationId: conversation.id })
  }

  return err("Perfil sem acesso a conversas.", 403)
}



