"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bot, Settings, MessageSquare, Play, Pause, Plus, Search } from "lucide-react"
import type { AgentConfig } from "@/lib/types"

const mockAgents: AgentConfig[] = [
  {
    id: "1",
    farmerId: "f1",
    farmerName: "João Silva",
    personality: "Profissional e empático",
    objectives: ["Maximizar aceitação de ofertas", "Manter bom relacionamento"],
    offerCalculation: "FIXED_PER_PRODUCT",
    fixedDiscounts: { alface: 15, tomate: 10 },
    isActive: true,
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
]

export default function AgentsPage() {
  const [search, setSearch] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  const [configForm, setConfigForm] = useState({
    personality: "",
    objectives: "",
    offerCalculation: "FIXED_PER_PRODUCT" as const,
    fixedDiscounts: "",
    customFormula: "",
    instructions: "",
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Gestão de Agentes IA
          </h1>
          <p className="text-muted-foreground mt-1">Configure e monitore os agentes que negociam com os agricultores</p>
        </div>
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Plus className="h-4 w-4" />
              Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configurar Agente IA</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Personalidade do Agente</Label>
                <Textarea
                  placeholder="Ex: Profissional, empático e direto. Valoriza transparência..."
                  rows={3}
                  value={configForm.personality}
                  onChange={(e) => setConfigForm({ ...configForm, personality: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Objetivos (um por linha)</Label>
                <Textarea
                  placeholder="Ex: Maximizar aceitação de ofertas&#10;Manter bom relacionamento&#10;Garantir entregas no prazo"
                  rows={4}
                  value={configForm.objectives}
                  onChange={(e) => setConfigForm({ ...configForm, objectives: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Cálculo de Oferta</Label>
                <Select
                  value={configForm.offerCalculation}
                  onValueChange={(value: any) => setConfigForm({ ...configForm, offerCalculation: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED_PER_PRODUCT">Desconto fixo por produto</SelectItem>
                    <SelectItem value="CUSTOM_PER_FARMER">Fórmula personalizada por agricultor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {configForm.offerCalculation === "FIXED_PER_PRODUCT" ? (
                <div className="space-y-2">
                  <Label>Descontos Fixos (%)</Label>
                  <Textarea
                    placeholder="Ex: alface: 15&#10;tomate: 10&#10;cenoura: 12"
                    rows={4}
                    value={configForm.fixedDiscounts}
                    onChange={(e) => setConfigForm({ ...configForm, fixedDiscounts: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Digite um produto por linha no formato: produto: desconto%
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Fórmula Personalizada</Label>
                  <Textarea
                    placeholder="Ex: valorMercado * 0.85 * (distancia < 10 ? 1.05 : 1)"
                    rows={3}
                    value={configForm.customFormula}
                    onChange={(e) => setConfigForm({ ...configForm, customFormula: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Variáveis disponíveis: valorMercado, distancia, quantidade
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Instruções Adicionais</Label>
                <Textarea
                  placeholder="Ex: Sempre mencionar práticas sustentáveis. Ser flexível com pequenos produtores..."
                  rows={3}
                  value={configForm.instructions}
                  onChange={(e) => setConfigForm({ ...configForm, instructions: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button>Salvar Configuração</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por agricultor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid gap-4">
        {mockAgents.map((agent) => (
          <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{agent.farmerName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{agent.personality}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Ativo" : "Pausado"}
                    </Badge>
                    <Badge variant="outline">
                      {agent.offerCalculation === "FIXED_PER_PRODUCT" ? "Desconto Fixo" : "Fórmula Custom"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <MessageSquare className="h-4 w-4" />
                  Ver Chat
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Settings className="h-4 w-4" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm">
                  {agent.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
