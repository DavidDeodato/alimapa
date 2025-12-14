"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function PerfilPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "João da Silva",
    phone: "(61) 98765-4321",
    address: "Sítio Boa Vista, Zona Rural",
    cafStatus: "ATIVO",
    products: ["Alface", "Tomate", "Cenoura"],
  })

  const [newProduct, setNewProduct] = useState("")

  const addProduct = () => {
    if (newProduct.trim()) {
      setFormData({
        ...formData,
        products: [...formData.products, newProduct.trim()],
      })
      setNewProduct("")
    }
  }

  const removeProduct = (index: number) => {
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Perfil atualizado com sucesso!")
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Mantenha suas informações atualizadas</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cafStatus">Status CAF</Label>
              <Select
                value={formData.cafStatus}
                onValueChange={(value) => setFormData({ ...formData, cafStatus: value })}
              >
                <SelectTrigger id="cafStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Produtos</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.products.map((product, index) => (
                <Badge key={index} variant="outline" className="gap-2">
                  {product}
                  <button onClick={() => removeProduct(index)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar produto..."
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProduct()}
              />
              <Button onClick={addProduct} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
