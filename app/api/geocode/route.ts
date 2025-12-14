import { z } from "zod"
import { err, ok } from "@/lib/api-response"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get("q") ?? ""
  const parsed = z.string().min(3).safeParse(q)
  if (!parsed.success) return err("Consulta inválida (mínimo 3 caracteres).", 400)

  // Nominatim (OSM) — proxy server-side para evitar CORS no browser
  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search")
  nominatimUrl.searchParams.set("q", parsed.data)
  nominatimUrl.searchParams.set("format", "json")
  nominatimUrl.searchParams.set("limit", "1")

  const res = await fetch(nominatimUrl.toString(), {
    headers: {
      // Nominatim exige User-Agent identificável
      "User-Agent": "alimapa-dev/1.0 (local)",
      Accept: "application/json",
    },
    // cache desativado para demo
    cache: "no-store",
  })

  if (!res.ok) return err("Falha ao buscar endereço.", 502)
  const data: any[] = await res.json()
  if (!data?.[0]) return err("Endereço não encontrado.", 404)

  return ok({
    lat: Number.parseFloat(data[0].lat),
    lng: Number.parseFloat(data[0].lon),
    displayName: data[0].display_name as string,
  })
}


