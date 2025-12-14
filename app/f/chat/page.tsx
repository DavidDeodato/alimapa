"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Send } from "lucide-react"
import type { ChatMessage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function ChatPage() {
  const { toast } = useToast()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState("")
  const [hasUnread, setHasUnread] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const load = async () => {
    try {
      const res = await fetch("/api/conversations")
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar conversas")
      const list = json.data.conversations || []
      if (!list.length) {
        setMessages([
          {
            id: "empty",
            role: "assistant",
            content: "Ainda não há conversas. Você receberá mensagens quando o gestor enviar propostas.",
            timestamp: new Date().toISOString(),
          },
        ])
        setHasUnread(false)
        return
      }

      const convId = list[0].id as string
      setConversationId(convId)

      const msgRes = await fetch(`/api/conversations/${convId}/messages`)
      const msgJson = await msgRes.json()
      if (!msgRes.ok || !msgJson?.ok) throw new Error(msgJson?.error || "Falha ao carregar mensagens")
      setMessages(msgJson.data.messages || [])
      setHasUnread(list[0].unreadCount > 0)
      await fetch(`/api/conversations/${convId}/read`, { method: "POST" }).catch(() => null)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível carregar o chat.", variant: "destructive" })
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSend = async () => {
    if (!message.trim()) return
    if (!conversationId) return

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMessage])
    setMessage("")

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.content }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao enviar")
      // mensagem já foi adicionada localmente; só atualiza lista/conversa
      setHasUnread(false)
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível enviar a mensagem.", variant: "destructive" })
    }
  }

  return (
    <div className="h-[calc(100vh-73px)]">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg rounded-none border-0">
        <div className="p-6 border-b bg-gradient-to-r from-card to-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Assistente Alimapa</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                  msg.role === "user" ? "flex-row-reverse" : "",
                )}
              >
                <Avatar
                  className={cn(
                    "h-10 w-10 flex items-center justify-center flex-shrink-0",
                    msg.role === "assistant" ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted",
                  )}
                >
                  {msg.role === "assistant" ? <Bot className="h-5 w-5 text-white" /> : <User className="h-5 w-5" />}
                </Avatar>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl p-4 shadow-sm",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-muted to-muted/50"
                      : "bg-gradient-to-br from-primary to-secondary text-primary-foreground",
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={cn(
                      "text-xs mt-2",
                      msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/80",
                    )}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {index === messages.length - 1 && msg.role === "assistant" && hasUnread && (
                  <Badge variant="destructive" className="mt-2 animate-pulse">
                    Novo
                  </Badge>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-6 border-t bg-gradient-to-r from-card to-muted/20 flex-shrink-0">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={2}
              className="resize-none shadow-sm"
            />
            <Button
              onClick={handleSend}
              size="icon"
              className="h-auto w-12 bg-gradient-to-br from-primary to-secondary hover:opacity-90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
