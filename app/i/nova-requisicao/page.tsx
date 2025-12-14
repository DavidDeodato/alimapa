"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowRight, ArrowLeft, MapPin } from "lucide-react"
import { toast } from "sonner"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const useMapEvents = dynamic(() => import("react-leaflet").then((mod) => mod.useMapEvents), { ssr: false })

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    program: "PNAE",
    urgency: 3,
    needByDate: "",
    title: "",
    justification: "",
    items: [{ productName: "", quantity: "", unit: "kg" }],
    lat: -23.5505,
    lng: -46.6333,
    address: "",
  })

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: "", unit: "kg" }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const handleAddressSearch = async () => {
    if (!formData.address) return

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.address)}&format=json&limit=1`,
      )
      const data = await response.json()
      if (data[0]) {
        setFormData({
          ...formData,
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
        })
        toast.success("Localização encontrada!")
      } else {
        toast.error("Endereço não encontrado")
      }
    } catch (error) {
      toast.error("Erro ao buscar endereço")
    }
  }

  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success(isDraft ? "Rascunho salvo com sucesso!" : "Requisição enviada com sucesso!")
      router.push("/i/requisicoes")
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Nova Requisição
          </h1>
          <p className="text-muted-foreground mt-1">Passo {step} de 3</p>
        </div>

        <Card className="p-6 shadow-lg">
          {step === 1 ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Dados Básicos</h2>

              <div className="space-y-2">
                <Label htmlFor="program">Programa</Label>
                <Select
                  value={formData.program}
                  onValueChange={(value) => setFormData({ ...formData, program: value })}
                >
                  <SelectTrigger id="program">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PNAE">PNAE - Programa Nacional de Alimentação Escolar</SelectItem>
                    <SelectItem value="PAA">PAA - Programa de Aquisição de Alimentos</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título da Requisição</Label>
                <Input
                  id="title"
                  placeholder="Ex: Merenda - reposição semanal"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgência</Label>
                  <Select
                    value={String(formData.urgency)}
                    onValueChange={(value) => setFormData({ ...formData, urgency: Number(value) })}
                  >
                    <SelectTrigger id="urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Baixa</SelectItem>
                      <SelectItem value="2">2 - Média</SelectItem>
                      <SelectItem value="3">3 - Alta</SelectItem>
                      <SelectItem value="4">4 - Urgente</SelectItem>
                      <SelectItem value="5">5 - Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="needByDate">Prazo de Entrega</Label>
                  <Input
                    id="needByDate"
                    type="date"
                    value={formData.needByDate}
                    onChange={(e) => setFormData({ ...formData, needByDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Itens Solicitados</h2>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label>Produto</Label>
                      <Input
                        placeholder="Ex: Alface"
                        value={item.productName}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].productName = e.target.value
                          setFormData({ ...formData, items: newItems })
                        }}
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...formData.items]
                          newItems[index].quantity = e.target.value
                          setFormData({ ...formData, items: newItems })
                        }}
                      />
                    </div>
                    <div className="w-24 space-y-2">
                      <Label>Unidade</Label>
                      <Select
                        value={item.unit}
                        onValueChange={(value) => {
                          const newItems = [...formData.items]
                          newItems[index].unit = value
                          setFormData({ ...formData, items: newItems })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="unidade">unidade</SelectItem>
                          <SelectItem value="litro">litro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.items.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização da Instituição
              </h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o endereço completo..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Button onClick={handleAddressSearch} variant="outline">
                      Buscar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ou clique no mapa para marcar sua localização</Label>
                  <div className="h-96 rounded-lg overflow-hidden border">
                    <MapContainer
                      center={[formData.lat, formData.lng]}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setFormData({ ...formData, lat, lng })
                          toast.success("Localização atualizada!")
                        }}
                      />
                      <Marker position={[formData.lat, formData.lng]} />
                    </MapContainer>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coordenadas: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading}>
                    Salvar Rascunho
                  </Button>
                  <Button onClick={() => handleSubmit(false)} disabled={loading}>
                    {loading ? "Enviando..." : "Enviar Requisição"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
