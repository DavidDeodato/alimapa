"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserRole } from "@/lib/types"

type RegisterPayload =
  | {
      role: "GESTOR"
      displayName: string
      email: string
      password: string
      municipality: { name: string; state: string; centerLat?: number; centerLng?: number }
    }
  | {
      role: "INSTITUICAO"
      displayName: string
      email: string
      password: string
      municipalityId?: string
      institution: { name: string; type: string; phone?: string; address?: string; lat?: number; lng?: number }
    }
  | {
      role: "AGRICULTOR"
      displayName: string
      email: string
      password: string
      municipalityId?: string
      farmer: {
        name: string
        phone?: string
        address?: string
        lat?: number
        lng?: number
        cafStatus: "ATIVO" | "PENDENTE" | "INATIVO"
        capacity?: string
        products: string[]
      }
    }
  | {
      role: "EMPRESA"
      displayName: string
      email: string
      password: string
      company: { name: string }
    }

export default function CadastroPage() {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>("INSTITUICAO")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Gestor / município
  const [munName, setMunName] = useState("Município Demo")
  const [munState, setMunState] = useState("DF")
  const [munLat, setMunLat] = useState<string>("")
  const [munLng, setMunLng] = useState<string>("")

  // Instituição
  const [instName, setInstName] = useState("")
  const [instType, setInstType] = useState("Escola")
  const [instAddress, setInstAddress] = useState("")
  const [instPhone, setInstPhone] = useState("")
  const [instLat, setInstLat] = useState<string>("")
  const [instLng, setInstLng] = useState<string>("")

  // Agricultor
  const [farmerName, setFarmerName] = useState("")
  const [farmerPhone, setFarmerPhone] = useState("")
  const [farmerAddress, setFarmerAddress] = useState("")
  const [farmerLat, setFarmerLat] = useState<string>("")
  const [farmerLng, setFarmerLng] = useState<string>("")
  const [cafStatus, setCafStatus] = useState<"ATIVO" | "PENDENTE" | "INATIVO">("ATIVO")
  const [capacity, setCapacity] = useState("")
  const [productsText, setProductsText] = useState("Alface, Tomate")

  // Empresa
  const [companyName, setCompanyName] = useState("")

  const parseNum = (v: string) => (v.trim() ? Number(v) : undefined)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const base = { role, displayName, email: email.toLowerCase().trim(), password }
    let payload: RegisterPayload

    if (role === "GESTOR") {
      payload = {
        ...base,
        role,
        municipality: {
          name: munName,
          state: munState,
          centerLat: parseNum(munLat),
          centerLng: parseNum(munLng),
        },
      }
    } else if (role === "INSTITUICAO") {
      payload = {
        ...base,
        role,
        institution: {
          name: instName,
          type: instType,
          phone: instPhone || undefined,
          address: instAddress || undefined,
          lat: parseNum(instLat),
          lng: parseNum(instLng),
        },
      }
    } else if (role === "AGRICULTOR") {
      payload = {
        ...base,
        role,
        farmer: {
          name: farmerName,
          phone: farmerPhone || undefined,
          address: farmerAddress || undefined,
          lat: parseNum(farmerLat),
          lng: parseNum(farmerLng),
          cafStatus,
          capacity: capacity || undefined,
          products: productsText
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean),
        },
      }
    } else {
      payload = { ...base, role, company: { name: companyName } }
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Falha ao cadastrar")
      router.push("/auth/login")
    } catch (err: any) {
      setError(err?.message || "Erro ao cadastrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-2xl card-elevated">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <Image src="/alimap.png" alt="Alimapa" width={180} height={48} className="h-12 w-auto" />
          </div>
          <div className="text-center">
            <CardTitle>Criar cadastro</CardTitle>
            <CardDescription>Escolha seu perfil e preencha as informações necessárias.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GESTOR">Gestor Municipal</SelectItem>
                    <SelectItem value="INSTITUICAO">Instituição</SelectItem>
                    <SelectItem value="AGRICULTOR">Agricultor</SelectItem>
                    <SelectItem value="EMPRESA">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nome (exibição)</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>

            {role === "GESTOR" && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="font-medium">Município</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do município</Label>
                    <Input value={munName} onChange={(e) => setMunName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Input value={munState} onChange={(e) => setMunState(e.target.value)} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Centro do mapa (lat)</Label>
                    <Input value={munLat} onChange={(e) => setMunLat(e.target.value)} placeholder="-15.78" />
                  </div>
                  <div className="space-y-2">
                    <Label>Centro do mapa (lng)</Label>
                    <Input value={munLng} onChange={(e) => setMunLng(e.target.value)} placeholder="-47.93" />
                  </div>
                </div>
              </div>
            )}

            {role === "INSTITUICAO" && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="font-medium">Dados da instituição</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={instName} onChange={(e) => setInstName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Input value={instType} onChange={(e) => setInstType(e.target.value)} required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={instPhone} onChange={(e) => setInstPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input value={instAddress} onChange={(e) => setInstAddress(e.target.value)} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lat</Label>
                    <Input value={instLat} onChange={(e) => setInstLat(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lng</Label>
                    <Input value={instLng} onChange={(e) => setInstLng(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {role === "AGRICULTOR" && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="font-medium">Dados do agricultor</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={farmerName} onChange={(e) => setFarmerName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={farmerPhone} onChange={(e) => setFarmerPhone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Input value={farmerAddress} onChange={(e) => setFarmerAddress(e.target.value)} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lat</Label>
                    <Input value={farmerLat} onChange={(e) => setFarmerLat(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lng</Label>
                    <Input value={farmerLng} onChange={(e) => setFarmerLng(e.target.value)} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status CAF</Label>
                    <Select value={cafStatus} onValueChange={(v) => setCafStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATIVO">Ativo</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="INATIVO">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Capacidade (texto)</Label>
                    <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="200 kg/semana" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Produtos (separados por vírgula)</Label>
                  <Input value={productsText} onChange={(e) => setProductsText(e.target.value)} />
                </div>
              </div>
            )}

            {role === "EMPRESA" && (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="font-medium">Dados da empresa</div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={loading}>
                {loading ? "Criando..." : "Criar cadastro"}
              </Button>
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/auth/login">Voltar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


