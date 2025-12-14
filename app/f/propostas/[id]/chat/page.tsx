"use client"

import { use } from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"
import type { ChatMessage } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { toast } = useToast()
  const { id } = use(params)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [offer, setOffer] = useState<{
    id: string
    status: string
    institutionName: string
    needByDate: string
    proposedValue?: number
    items: Array<{ productName: string; quantity: number; unit: string }>
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const load = async () => {
    try {
      // carregar resumo real da proposta
      const offerRes = await fetch(`/api/f/offers/${id}`)
      const offerJson = await offerRes.json().catch(() => null)
      if (offerRes.ok && offerJson?.ok) setOffer(offerJson.data.offer)

      const convRes = await fetch(`/api/offers/${id}/conversation`)
      const convJson = await convRes.json()
      if (!convRes.ok || !convJson?.ok) throw new Error(convJson?.error || "Falha ao carregar conversa")
      const convId = convJson.data.conversationId as string
      setConversationId(convId)

      const msgRes = await fetch(`/api/conversations/${convId}/messages`)
      const msgJson = await msgRes.json()
      if (!msgRes.ok || !msgJson?.ok) throw new Error(msgJson?.error || "Falha ao carregar mensagens")
      setMessages(msgJson.data.messages || [])
      await fetch(`/api/conversations/${convId}/read`, { method: "POST" }).catch(() => null)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível carregar o chat.", variant: "destructive" })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleSend = async () => {
    if (!message.trim()) return
    if (!conversationId) return
    const content = message
    setMessage("")
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao enviar")
      setMessages((prev) => [...prev, json.data.message])
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível enviar a mensagem.", variant: "destructive" })
    }
  }

  const accept = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/f/offers/${id}/accept`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao aceitar")
      toast({ title: "Proposta aceita" })
      await load()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao aceitar", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const decline = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/f/offers/${id}/decline`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao recusar")
      toast({ title: "Proposta recusada" })
      await load()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao recusar", variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Chat - Proposta #{id}</h1>
            <Badge variant="default">{offer?.status === "SENT" ? "Aguardando Resposta" : offer?.status ?? "—"}</Badge>
          </div>
          <p className="text-muted-foreground">Converse com o agente sobre esta proposta</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/f/propostas/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <Card className="flex-1 flex flex-col">
        <div className="p-6 border-b bg-blue-50">
          <div className="text-sm font-medium mb-2">Resumo da Proposta</div>
          <div className="text-sm text-muted-foreground">
            {offer
              ? `${offer.items
                  .slice(0, 3)
                  .map((it) => `${it.quantity} ${it.unit} de ${it.productName}`)
                  .join(" + ")} • ${
                  offer.proposedValue != null ? `R$ ${offer.proposedValue.toFixed(2)}` : "R$ —"
                } • Prazo: ${new Date(offer.needByDate).toLocaleDateString("pt-BR")}`
              : "Carregando resumo..."}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <div className="text-xs opacity-70 mt-2">{new Date(msg.timestamp).toLocaleTimeString("pt-BR")}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t">
          <div className="flex gap-3 mb-4">
            <Button size="sm" className="flex-1" onClick={accept} disabled={actionLoading || offer?.status !== "SENT"}>
              <Check className="h-4 w-4 mr-2" />
              Aceitar Proposta
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={decline}
              disabled={actionLoading || offer?.status !== "SENT"}
            >
              <X className="h-4 w-4 mr-2" />
              Recusar
            </Button>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
