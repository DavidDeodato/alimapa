import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalities = await prisma.municipality.findMany({
    orderBy: [{ state: "asc" }, { name: "asc" }],
    select: { id: true, name: true, state: true, centerLat: true, centerLng: true, createdAt: true },
    take: 1000,
  })

  return ok({
    municipalities: municipalities.map((m) => ({
      id: m.id,
      name: m.name,
      state: m.state,
      centerLat: m.centerLat ?? undefined,
      centerLng: m.centerLng ?? undefined,
      createdAt: m.createdAt.toISOString(),
    })),
  })
}



