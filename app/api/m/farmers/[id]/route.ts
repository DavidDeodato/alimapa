import { ok, err } from "@/lib/api-response"
import { prisma } from "@/lib/db"
import { requireRole } from "@/lib/auth-server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return err("Agricultor inválido.", 400)

  const auth = await requireRole("GESTOR")
  if (!auth.ok) return err(auth.error, 401)

  const municipalityId = auth.user.municipalityId
  if (!municipalityId) return err("Gestor sem município associado.", 400)

  const farmer = await prisma.farmer.findUnique({ where: { id } })
  if (!farmer) return err("Agricultor não encontrado.", 404)
  if (farmer.municipalityId !== municipalityId) return err("Acesso negado.", 403)

  return ok({
    farmer: {
      id: farmer.id,
      name: farmer.name,
      products: farmer.products,
      capacity: farmer.capacity ?? undefined,
      cafStatus: farmer.cafStatus,
      lat: farmer.lat ?? undefined,
      lng: farmer.lng ?? undefined,
      address: farmer.address ?? undefined,
      phone: farmer.phone ?? undefined,
      createdAt: farmer.createdAt.toISOString(),
      updatedAt: farmer.updatedAt.toISOString(),
    },
  })
}


