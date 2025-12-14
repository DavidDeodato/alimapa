"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PerfilPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [me, setMe] = useState<any>(null)

  const [formData, setFormData] = useState({
    displayName: "",
    name: "",
    phone: "",
    address: "",
    cafStatus: "ATIVO",
    capacity: "",
    lat: "",
    lng: "",
    products: [] as string[],
  })

  const [newProduct, setNewProduct] = useState("")

  const avatarUrl = me?.user?.avatarUrl || null
  const avatarInitial = useMemo(() => (formData.displayName || "U")[0], [formData.displayName])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/me")
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar perfil")

      setMe(json.data)
      const farmer = json.data?.profile?.farmer
      setFormData({
        displayName: json.data?.user?.displayName || "",
        name: farmer?.name || "",
        phone: farmer?.phone || "",
        address: farmer?.address || "",
        cafStatus: farmer?.cafStatus || "ATIVO",
        capacity: farmer?.capacity || "",
        lat: farmer?.lat?.toString?.() || "",
        lng: farmer?.lng?.toString?.() || "",
        products: Array.isArray(farmer?.products) ? farmer.products : [],
      })
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível carregar seu perfil.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onPickAvatar = async (file: File) => {
    try {
      const signRes = await fetch("/api/uploads/cloudinary/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType: "image" }),
      })
      const signJson = await signRes.json()
      if (!signRes.ok || !signJson?.ok) throw new Error(signJson?.error || "Falha ao preparar upload")

      const { cloudName, apiKey, timestamp, signature, folder } = signJson.data
      const form = new FormData()
      form.append("file", file)
      form.append("api_key", apiKey)
      form.append("timestamp", String(timestamp))
      form.append("signature", signature)
      form.append("folder", folder)

      const upRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form })
      const upJson = await upRes.json()
      if (!upRes.ok) throw new Error(upJson?.error?.message || "Falha no upload")

      const saveRes = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: upJson.secure_url, avatarPublicId: upJson.public_id }),
      })
      const saveJson = await saveRes.json()
      if (!saveRes.ok || !saveJson?.ok) throw new Error(saveJson?.error || "Falha ao salvar foto")

      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi atualizada." })
      await load()
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e?.message || "Não foi possível enviar a imagem.", variant: "destructive" })
    }
  }

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
    setSaving(true)
    try {
      const payload = {
        displayName: formData.displayName,
        farmer: {
          name: formData.name,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          cafStatus: formData.cafStatus,
          capacity: formData.capacity || undefined,
          lat: formData.lat.trim() ? Number(formData.lat) : undefined,
          lng: formData.lng.trim() ? Number(formData.lng) : undefined,
          products: formData.products,
        },
      }
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao salvar")
      toast({ title: "Perfil atualizado", description: "Alterações salvas com sucesso." })
      await load()
    } catch (error: any) {
      toast({ title: "Erro", description: error?.message || "Ocorreu um erro. Tente novamente.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Mantenha suas informações atualizadas</p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex items-center justify-center border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Foto do perfil" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">{avatarInitial}</span>
              )}
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Foto do perfil</div>
              <div className="flex gap-2">
                <input
                  id="avatar-upload-f"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onPickAvatar(f)
                    e.currentTarget.value = ""
                  }}
                />
                <Button asChild type="button" variant="outline" className="bg-transparent">
                  <label htmlFor="avatar-upload-f" className="cursor-pointer">
                    Trocar foto
                  </label>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={async () => {
                    const res = await fetch("/api/me/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ avatarUrl: null, avatarPublicId: null }),
                    })
                    const json = await res.json()
                    if (!res.ok || !json?.ok) {
                      toast({ title: "Erro", description: json?.error || "Não foi possível remover a foto.", variant: "destructive" })
                      return
                    }
                    toast({ title: "Foto removida" })
                    await load()
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Nome (exibição)</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Lat</Label>
              <Input id="lat" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Lng</Label>
              <Input id="lng" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidade</Label>
            <Input
              id="capacity"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="200 kg/semana"
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

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
