import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

const Common = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  avatarPublicId: z.string().nullable().optional(),
})

const FarmerSchema = Common.extend({
  farmer: z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      cafStatus: z.enum(["ATIVO", "PENDENTE", "INATIVO"]).optional(),
      capacity: z.string().optional(),
      products: z.array(z.string().min(1)).optional(),
    })
    .optional(),
})

const InstitutionSchema = Common.extend({
  institution: z
    .object({
      name: z.string().min(2).optional(),
      type: z.string().min(2).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
})

const CompanySchema = Common.extend({
  company: z
    .object({
      name: z.string().min(2).optional(),
    })
    .optional(),
})

const ManagerSchema = Common.extend({
  municipality: z
    .object({
      name: z.string().min(2).optional(),
      state: z.string().min(2).max(2).optional(),
      centerLat: z.number().optional(),
      centerLng: z.number().optional(),
    })
    .optional(),
})

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return err("Não autenticado.", 401)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err("JSON inválido no corpo da requisição.", 400)
  }

  const role = String((session.user as any).role || "")

  const parsed =
    role === "AGRICULTOR"
      ? FarmerSchema.safeParse(body)
      : role === "INSTITUICAO"
        ? InstitutionSchema.safeParse(body)
        : role === "EMPRESA"
          ? CompanySchema.safeParse(body)
          : role === "GESTOR"
            ? ManagerSchema.safeParse(body)
            : null

  if (!parsed || !parsed.success) return err("Payload inválido.", 400)

  const { displayName, avatarUrl, avatarPublicId } = parsed.data

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(displayName ? { displayName } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      ...(avatarPublicId !== undefined ? { avatarPublicId } : {}),
    },
  })

  if (role === "AGRICULTOR" && parsed.data.farmer) {
    await prisma.farmer.update({
      where: { userId: session.user.id },
      data: {
        ...parsed.data.farmer,
      },
    })
  }

  if (role === "INSTITUICAO" && parsed.data.institution) {
    await prisma.institution.update({
      where: { userId: session.user.id },
      data: {
        ...parsed.data.institution,
      },
    })
  }

  if (role === "EMPRESA" && parsed.data.company) {
    await prisma.company.update({
      where: { userId: session.user.id },
      data: {
        ...parsed.data.company,
      },
    })
  }

  if (role === "GESTOR" && parsed.data.municipality) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { municipalityId: true },
    })
    if (user?.municipalityId) {
      await prisma.municipality.update({
        where: { id: user.municipalityId },
        data: { ...parsed.data.municipality },
      })
    }
  }

  return ok({ updated: true })
}



