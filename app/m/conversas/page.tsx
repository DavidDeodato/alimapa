"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { Search, Bot, User, Send, Pause } from "lucide-react"
import type { Conversation } from "@/lib/types"
import { cn } from "@/lib/utils"

const mockConversations: Conversation[] = [
  {
    id: "1",
    farmerId: "f1",
    farmerName: "João Silva",
    agentConfigId: "a1",
    messages: [
      {
        id: "m1",
        role: "assistant",
        content: "Olá João! Temos uma nova requisição de alface. Você tem interesse?",
        timestamp: "2025-01-14T10:00:00Z",
      },
      {
        id: "m2",
        role: "user",
        content: "Sim, tenho interesse! Qual a quantidade?",
        timestamp: "2025-01-14T10:05:00Z",
      },
      {
        id: "m3",
        role: "assistant",
        content: "São 50kg de alface. O valor de mercado é R$ 5/kg. Posso oferecer R$ 4,25/kg pelo programa PNAE.",
        timestamp: "2025-01-14T10:06:00Z",
      },
    ],
    status: "ACTIVE",
    unreadCount: 1,
    lastMessageAt: "2025-01-14T10:06:00Z",
    createdAt: "2025-01-14T10:00:00Z",
  },
]

export default function ConversasPage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0])
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")

  const handleSendMessage = () => {
    if (!message.trim()) return
    // Send message logic here
    setMessage("")
  }

  return (
    <div className="p-6 h-[calc(100vh-73px)]">
      <div className="h-full flex gap-4">
        {/* Conversations list */}
        <Card className="w-80 flex flex-col overflow-hidden">
          <div className="p-4 border-b space-y-4">
            <h2 className="font-semibold text-lg">Conversas com Agricultores</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {mockConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left hover:bg-muted/50 transition-colors",
                    selectedConv?.id === conv.id && "bg-muted",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{conv.farmerName}</p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 rounded-full text-xs px-1.5">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-1">
                        {conv.messages[conv.messages.length - 1]?.content}
                      </p>
                    </div>
                    <Badge variant={conv.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">
                      {conv.status === "ACTIVE" ? "Ativo" : "Pausado"}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat area */}
        {selectedConv ? (
          <Card className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {selectedConv.farmerName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedConv.farmerName}</h3>
                  <p className="text-sm text-muted-foreground">Conversa com Agente IA</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Pause className="h-4 w-4" />
                  Pausar Agente
                </Button>
                <Button variant="outline" size="sm">
                  Intervir
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {selectedConv.messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}>
                    <Avatar
                      className={cn(
                        "h-8 w-8 flex items-center justify-center",
                        msg.role === "assistant" ? "bg-gradient-to-br from-primary to-secondary" : "bg-muted",
                      )}
                    >
                      {msg.role === "assistant" ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4" />}
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        msg.role === "assistant" ? "bg-muted" : "bg-primary text-primary-foreground",
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/70",
                        )}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua mensagem para intervir na conversa..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  rows={2}
                  className="resize-none"
                />
                <Button onClick={handleSendMessage} size="icon" className="h-auto">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Selecione uma conversa para visualizar</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
