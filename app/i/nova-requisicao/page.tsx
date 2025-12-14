"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowRight, ArrowLeft, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Fix do Marker do Leaflet no bundler (senão o ícone some)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const pulseIcon = L.divIcon({
  className: "",
  html: '<div class="pulse-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function LocationPicker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapResizer({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
      map.setView(center)
    }, 50)
  }, [map, center])
  return null
}

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mapKey, setMapKey] = useState(0)

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

  const center = useMemo<[number, number]>(() => [formData.lat, formData.lng], [formData.lat, formData.lng])

  useEffect(() => {
    if (step === 3) setMapKey((k) => k + 1)
  }, [step])

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
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(formData.address)}`)
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || "Endereço não encontrado")

      setFormData({
        ...formData,
        lat: json.data.lat,
        lng: json.data.lng,
      })

      toast({ title: "Localização encontrada", description: json.data.displayName })
    } catch (error: any) {
      toast({
        title: "Erro ao buscar endereço",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (isDraft: boolean) => {
    const normalizedItems = formData.items
      .map((i) => ({
        productName: i.productName.trim(),
        quantity: Number(i.quantity),
        unit: i.unit,
      }))
      .filter((i) => i.productName && Number.isFinite(i.quantity) && i.quantity > 0)

    if (!isDraft && normalizedItems.length === 0) {
      toast({
        title: "Itens obrigatórios",
        description: "Adicione pelo menos 1 item (produto e quantidade) antes de enviar.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const payload = {
        program: formData.program,
        urgency: formData.urgency,
        needByDate: formData.needByDate,
        title: formData.title || undefined,
        justification: formData.justification || undefined,
        address: formData.address || undefined,
        lat: formData.lat,
        lng: formData.lng,
        items: normalizedItems,
        isDraft,
      }

      const res = await fetch("/api/i/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao salvar requisição")

      toast({
        title: isDraft ? "Rascunho salvo" : "Requisição enviada",
        description: isDraft ? "Você pode editar e enviar depois." : "O gestor municipal poderá validar e orquestrar.",
      })
      router.push("/i/requisicoes")
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Ocorreu um erro. Tente novamente.", variant: "destructive" })
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
                  <div className="h-[420px] rounded-lg overflow-hidden border">
                    <MapContainer
                      key={mapKey}
                      center={center}
                      zoom={13}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapResizer center={center} />
                      <LocationPicker
                        onLocationSelect={(lat, lng) => {
                          setFormData({ ...formData, lat, lng })
                          toast({ title: "Localização atualizada", description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
                        }}
                      />
                      <Marker position={center} icon={pulseIcon} />
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
