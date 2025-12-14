"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"

export default function ChatPage({ params }: { params: { id: string } }) {
  const { id } = params
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "assistant" as const,
      content:
        "Olá! Sou o agente da Alimapa. Estou aqui para ajudá-lo com esta proposta. Posso esclarecer dúvidas sobre capacidade de produção, prazos e documentação necessária. Como posso ajudar?",
      timestamp: new Date().toISOString(),
    },
  ])

  const handleSend = () => {
    if (!message.trim()) return

    setMessages([
      ...messages,
      {
        id: String(messages.length + 1),
        role: "user" as const,
        content: message,
        timestamp: new Date().toISOString(),
      },
    ])
    setMessage("")

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(prev.length + 1),
          role: "assistant" as const,
          content: "Entendo sua dúvida. Vou verificar essas informações para você...",
          timestamp: new Date().toISOString(),
        },
      ])
    }, 1000)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Chat - Proposta #{id}</h1>
            <Badge variant="default">Aguardando Resposta</Badge>
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
            50 kg de Alface + 30 kg de Tomate • R$ 450,00 • Prazo: 20/01/2025
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
        </div>

        <div className="p-6 border-t">
          <div className="flex gap-3 mb-4">
            <Button size="sm" className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Aceitar Proposta
            </Button>
            <Button size="sm" variant="outline" className="flex-1 bg-transparent">
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
