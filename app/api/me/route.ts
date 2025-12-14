import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return err("Não autenticado.", 401)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
      avatarUrl: true,
      avatarPublicId: true,
      municipalityId: true,
    },
  })

  if (!user) return err("Usuário não encontrado.", 404)

  if (user.role === "AGRICULTOR") {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        lat: true,
        lng: true,
        cafStatus: true,
        capacity: true,
        products: true,
        municipalityId: true,
      },
    })
    return ok({ user, profile: { farmer } })
  }

  if (user.role === "INSTITUICAO") {
    const institution = await prisma.institution.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
        address: true,
        lat: true,
        lng: true,
        municipalityId: true,
      },
    })
    return ok({ user, profile: { institution } })
  }

  if (user.role === "EMPRESA") {
    const company = await prisma.company.findUnique({
      where: { userId: user.id },
      select: { id: true, name: true },
    })
    return ok({ user, profile: { company } })
  }

  // GESTOR
  const municipality = user.municipalityId
    ? await prisma.municipality.findUnique({
        where: { id: user.municipalityId },
        select: { id: true, name: true, state: true, centerLat: true, centerLng: true },
      })
    : null

  return ok({ user, profile: { municipality } })
}



