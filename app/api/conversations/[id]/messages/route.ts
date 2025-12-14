import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

function mapSenderToRole(sender: string) {
  return sender === "FARMER" ? "user" : "assistant"
}

async function assertAccess(conversationId: string, session: any) {
  const role = session?.user ? (session.user as any).role : null
  const userId = session?.user ? (session.user as any).id : null
  const municipalityId = session?.user ? (session.user as any).municipalityId : null
  if (!role || !userId) return { ok: false as const, status: 401, error: "Sessão inválida." }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { farmer: true, offer: { include: { request: true } } },
  })
  if (!conversation) return { ok: false as const, status: 404, error: "Conversa não encontrada." }

  if (role === "AGRICULTOR") {
    if (conversation.farmer.userId !== userId) return { ok: false as const, status: 403, error: "Acesso negado." }
    return { ok: true as const, role, conversation }
  }

  if (role === "GESTOR") {
    if (!municipalityId) return { ok: false as const, status: 400, error: "Gestor sem município associado." }
    if (conversation.offer.request.municipalityId !== municipalityId) return { ok: false as const, status: 403, error: "Acesso negado." }
    return { ok: true as const, role, conversation }
  }

  return { ok: false as const, status: 403, error: "Perfil sem acesso a conversas." }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Conversa inválida.", 400)
  const session = await getServerSession(authOptions)
  if (!session?.user) return err("Não autenticado.", 401)

  const access = await assertAccess(id, session)
  if (!access.ok) return err(access.error, access.status)

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  })

  return ok({
    conversationId: id,
    messages: messages.map((m) => ({
      id: m.id,
      role: mapSenderToRole(m.sender),
      content: m.content,
      timestamp: m.createdAt.toISOString(),
    })),
  })
}

const SendSchema = z.object({
  content: z.string().min(1),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Conversa inválida.", 400)
  const session = await getServerSession(authOptions)
  if (!session?.user) return err("Não autenticado.", 401)

  const access = await assertAccess(id, session)
  if (!access.ok) return err(access.error, access.status)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }
  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) return err("Mensagem inválida.", 400)

  const sender = access.role === "AGRICULTOR" ? "FARMER" : "MANAGER"

  const created = await prisma.message.create({
    data: {
      conversationId: id,
      sender,
      content: parsed.data.content,
    },
  })

  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: created.createdAt,
      ...(sender === "FARMER" ? { unreadManager: { increment: 1 } } : { unreadFarmer: { increment: 1 } }),
    },
  })

  return ok({
    message: {
      id: created.id,
      role: mapSenderToRole(created.sender),
      content: created.content,
      timestamp: created.createdAt.toISOString(),
    },
  })
}



