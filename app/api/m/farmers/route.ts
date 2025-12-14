import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET() {
  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const farmers = await prisma.farmer.findMany({
    where: { municipalityId },
    orderBy: { createdAt: "asc" },
    take: 500,
  })

  return ok({
    farmers: farmers.map((f) => ({
      id: f.id,
      name: f.name,
      products: f.products,
      capacity: f.capacity ?? undefined,
      cafStatus: f.cafStatus,
      lat: f.lat ?? undefined,
      lng: f.lng ?? undefined,
      address: f.address ?? undefined,
      phone: f.phone ?? undefined,
    })),
  })
}



