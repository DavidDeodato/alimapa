"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/types"

function LoginInner() {
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("INSTITUICAO")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // validação rápida de role vs conta (mensagem melhor que o erro genérico do NextAuth)
    try {
      const pre = await fetch(`/api/auth/precheck?email=${encodeURIComponent(email.toLowerCase().trim())}`)
      const preJson = await pre.json().catch(() => null)
      if (pre.ok && preJson?.ok) {
        if (!preJson.data.exists) {
          const msg = "Conta não encontrada. Faça seu cadastro."
          setError(msg)
          toast({ title: "Conta não encontrada", description: msg, variant: "destructive" })
          setLoading(false)
          return
        }
        if (preJson.data.role && preJson.data.role !== role) {
          const msg = `Tipo de acesso incorreto. Essa conta é do perfil: ${String(preJson.data.role)}.`
          setError(msg)
          toast({ title: "Perfil incompatível", description: msg, variant: "destructive" })
          setLoading(false)
          return
        }
      }
    } catch {
      // se precheck falhar, segue pro signIn normalmente
    }

    const res = await signIn("credentials", {
      role,
      email,
      password,
      redirect: false,
      callbackUrl,
    })
    setLoading(false)
    if (!res || res.error) {
      const msg = "Email ou senha inválidos."
      setError(msg)
      toast({ title: "Falha no login", description: msg, variant: "destructive" })
      return
    }
    router.push(res.url || "/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md card-elevated">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <Image src="/alimap.png" alt="Alimapa" width={180} height={48} className="h-12 w-auto" />
          </div>
          <div className="text-center">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse a plataforma com sua conta.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Sou</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GESTOR">Gestor Municipal</SelectItem>
                  <SelectItem value="INSTITUICAO">Instituição (Escola/ONG)</SelectItem>
                  <SelectItem value="AGRICULTOR">Agricultor Familiar</SelectItem>
                  <SelectItem value="EMPRESA">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-muted-foreground">
              Não tem conta?{" "}
              <Link href="/auth/cadastro" className="text-primary underline underline-offset-4">
                Criar cadastro
              </Link>
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Contas demo: gestor@demo.alimapa / instituicao@demo.alimapa / agricultor@demo.alimapa / empresa@demo.alimapa (senha: demo1234)
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}


