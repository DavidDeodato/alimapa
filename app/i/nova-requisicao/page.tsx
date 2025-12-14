"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowRight, ArrowLeft, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const LocationMapPicker = dynamic(() => import("@/components/location-map-picker").then((m) => m.LocationMapPicker), {
  ssr: false,
})

export default function NovaRequisicaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  const [requestId, setRequestId] = useState<string>("")
  const [evidence, setEvidence] = useState<
    Array<{
      id: string
      scope: string
      url: string
      originalName?: string
      resourceType?: string
      fileType?: string
      createdAt: string
    }>
  >([])
  const [uploading, setUploading] = useState(false)

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

  const createOrUpdateDraft = async () => {
    const normalizedItems = formData.items
      .map((i) => ({
        productName: i.productName.trim(),
        quantity: Number(i.quantity),
        unit: i.unit,
      }))
      .filter((i) => i.productName && Number.isFinite(i.quantity) && i.quantity > 0)

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
        isDraft: true,
      }

      if (requestId) {
        const res = await fetch(`/api/i/requests/${requestId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            program: payload.program,
            urgency: payload.urgency,
            needByDate: payload.needByDate,
            title: payload.title ?? null,
            justification: payload.justification ?? null,
            address: payload.address ?? null,
            lat: payload.lat ?? null,
            lng: payload.lng ?? null,
            items: payload.items,
          }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao atualizar rascunho")
        toast({ title: "Rascunho atualizado" })
        return requestId
      } else {
        const res = await fetch("/api/i/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao salvar requisição")

        const createdId = json.data.request.id as string
        setRequestId(createdId)
        toast({ title: "Rascunho criado", description: "Agora você pode anexar provas." })
        return createdId
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Ocorreu um erro. Tente novamente.", variant: "destructive" })
      return null
    } finally {
      setLoading(false)
    }
  }

  const uploadEvidence = async (file: File, scope: "REQUEST_PROOF" | "REQUEST_DOCUMENT") => {
    if (!requestId) return
    setUploading(true)
    try {
      const resourceType = file.type.startsWith("image/") ? "image" : "raw"
      const signRes = await fetch("/api/uploads/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "evidence", resourceType, scope, requestId }),
      })
      const signJson = await signRes.json().catch(() => null)
      if (!signRes.ok || !signJson?.ok) throw new Error(signJson?.error || "Falha ao preparar upload")

      const { cloudName, apiKey, timestamp, signature, folder } = signJson.data
      const form = new FormData()
      form.append("file", file)
      form.append("api_key", apiKey)
      form.append("timestamp", String(timestamp))
      form.append("signature", signature)
      form.append("folder", folder)

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, { method: "POST", body: form })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson?.error?.message || "Falha no upload")

      const saveRes = await fetch(`/api/i/requests/${requestId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          url: upJson.secure_url,
          publicId: upJson.public_id,
          resourceType,
          fileType: file.type || undefined,
          originalName: file.name || undefined,
          sizeBytes: file.size || undefined,
        }),
      })
      const saveJson = await saveRes.json().catch(() => null)
      if (!saveRes.ok || !saveJson?.ok) throw new Error(saveJson?.error || "Falha ao anexar prova")

      setEvidence((prev) => [saveJson.data.evidence, ...prev])
      toast({ title: "Prova anexada" })
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível anexar a prova.", variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const removeEvidence = async (evidenceId: string) => {
    if (!requestId) return
    try {
      const res = await fetch(`/api/i/requests/${requestId}/evidence/${evidenceId}`, { method: "DELETE" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao remover")
      setEvidence((prev) => prev.filter((e) => e.id !== evidenceId))
      toast({ title: "Prova removida" })
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível remover.", variant: "destructive" })
    }
  }

  const submitRequest = async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/i/requests/${requestId}/submit`, { method: "POST" })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao enviar requisição")
      toast({ title: "Requisição enviada", description: "O gestor municipal poderá validar e orquestrar." })
      router.push("/i/requisicoes")
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Falha ao enviar", variant: "destructive" })
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
          <p className="text-muted-foreground mt-1">Passo {step} de 4</p>
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
          ) : step === 3 ? (
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
                  <LocationMapPicker
                    key={mapKey}
                    center={center}
                    height={420}
                    onPick={(lat, lng) => {
                      setFormData({ ...formData, lat, lng })
                      toast({ title: "Localização atualizada", description: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
                    }}
                  />
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
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const id = requestId || (await createOrUpdateDraft())
                      if (id) router.push("/i/requisicoes")
                    }}
                    disabled={loading}
                  >
                    Salvar Rascunho
                  </Button>
                  <Button
                    onClick={async () => {
                      const id = requestId || (await createOrUpdateDraft())
                      if (id) setStep(4)
                    }}
                    disabled={loading}
                  >
                    Próximo (Provas)
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Provas e Documentos</h2>
              <p className="text-sm text-muted-foreground">
                Anexe pelo menos 1 prova (foto do local ou documento) para enviar a requisição.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fotos do local (interno/externo)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm"
                    disabled={uploading || loading || !requestId}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadEvidence(f, "REQUEST_PROOF")
                      e.currentTarget.value = ""
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Documentos (PDF)</Label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    className="block w-full text-sm"
                    disabled={uploading || loading || !requestId}
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) void uploadEvidence(f, "REQUEST_DOCUMENT")
                      e.currentTarget.value = ""
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Dica: se o documento for foto, pode enviar como imagem.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium">Anexos ({evidence.length})</div>
                {evidence.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma prova anexada ainda.</div>
                ) : (
                  <div className="grid gap-2">
                    {evidence.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-3 rounded border bg-muted/30">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{e.originalName || e.scope}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.url}</div>
                        </div>
                        <Button variant="outline" className="bg-transparent" onClick={() => removeEvidence(e.id)}>
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-between">
                <Button variant="outline" onClick={() => setStep(3)} disabled={loading || uploading}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={submitRequest} disabled={loading || uploading || !requestId}>
                  {loading ? "Enviando..." : "Enviar Requisição"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
