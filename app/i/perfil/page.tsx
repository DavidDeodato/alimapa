"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"

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

type MeResponse = {
  ok: true
  data: {
    user: {
      id: string
      role: "INSTITUICAO"
      displayName: string
      email?: string | null
      avatarUrl?: string | null
      avatarPublicId?: string | null
    }
    profile: {
      institution: {
        id: string
        name: string
        type: string
        phone?: string | null
        address?: string | null
        lat?: number | null
        lng?: number | null
      } | null
    }
  }
}

export default function InstituicaoPerfilPage() {
  const { toast } = useToast()
  const { update } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [me, setMe] = useState<MeResponse["data"] | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")

  const avatarUrl = me?.user.avatarUrl || null
  const avatarInitial = useMemo(() => (displayName || "U")[0], [displayName])
  const center = useMemo<[number, number]>(() => {
    const la = lat.trim() ? Number(lat) : NaN
    const ln = lng.trim() ? Number(lng) : NaN
    return [Number.isFinite(la) ? la : -15.78, Number.isFinite(ln) ? ln : -47.93]
  }, [lat, lng])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/me")
      const json = (await res.json()) as MeResponse | any
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao carregar perfil")
      setMe(json.data)
      setDisplayName(json.data.user.displayName || "")
      setName(json.data.profile.institution?.name || "")
      setType(json.data.profile.institution?.type || "")
      setPhone(json.data.profile.institution?.phone || "")
      setAddress(json.data.profile.institution?.address || "")
      setLat(json.data.profile.institution?.lat?.toString?.() || "")
      setLng(json.data.profile.institution?.lng?.toString?.() || "")
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
      await update({ avatarUrl: upJson.secure_url })
      await load()
    } catch (e: any) {
      toast({ title: "Erro no upload", description: e?.message || "Não foi possível enviar a imagem.", variant: "destructive" })
    }
  }

  const onSave = async () => {
    setSaving(true)
    try {
      const payload = {
        displayName,
        institution: {
          name,
          type,
          phone: phone || undefined,
          address: address || undefined,
          lat: lat.trim() ? Number(lat) : undefined,
          lng: lng.trim() ? Number(lng) : undefined,
        },
      }
      const res = await fetch("/api/me/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao salvar")
      toast({ title: "Perfil atualizado", description: "Alterações salvas com sucesso." })
      await update({ name: displayName })
      await load()
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível salvar.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Atualize seus dados e a foto do seu perfil.</p>
      </div>

      <Card className="p-6 space-y-6">
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
                id="avatar-upload-i"
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
                <label htmlFor="avatar-upload-i" className="cursor-pointer">
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
                  await update({ avatarUrl: null })
                  await load()
                }}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome (exibição)</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={me?.user.email || ""} readOnly />
          </div>
        </div>

        <div className="border rounded-lg p-4 space-y-4">
          <div className="font-medium">Instituição</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <div className="flex gap-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent"
                  onClick={async () => {
                    const q = address.trim()
                    if (q.length < 3) {
                      toast({ title: "Endereço inválido", description: "Digite um endereço com pelo menos 3 caracteres.", variant: "destructive" })
                      return
                    }
                    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
                    const json = await res.json().catch(() => null)
                    if (!res.ok || !json?.ok) {
                      toast({ title: "Endereço não encontrado", description: json?.error || "Tente outro endereço.", variant: "destructive" })
                      return
                    }
                    setAddress(String(json.data.displayName || q))
                    setLat(String(json.data.lat))
                    setLng(String(json.data.lng))
                    toast({ title: "Localização encontrada" })
                  }}
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lat</Label>
              <Input value={lat} onChange={(e) => setLat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Lng</Label>
              <Input value={lng} onChange={(e) => setLng(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ou clique no mapa para marcar</Label>
            <div className="h-[320px] rounded-lg overflow-hidden border">
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapResizer center={center} />
                <LocationPicker
                  onLocationSelect={(la, ln) => {
                    setLat(String(la))
                    setLng(String(ln))
                    toast({ title: "Localização marcada", description: `${la.toFixed(5)}, ${ln.toFixed(5)}` })
                  }}
                />
                <Marker position={center} icon={pulseIcon} />
              </MapContainer>
            </div>
          </div>
        </div>

        <Button onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </Card>
    </div>
  )
}


