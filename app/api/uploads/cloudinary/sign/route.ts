import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { err, ok } from "@/lib/api-response"
import { cloudinarySign, getCloudinaryConfig } from "@/lib/cloudinary"

const BodySchema = z.object({
  purpose: z.enum(["avatar", "evidence"]).optional().default("avatar"),
  // cloudinary resource type
  resourceType: z.enum(["image", "raw"]).optional().default("image"),
  // quando purpose=evidence
  scope: z
    .enum([
      "REQUEST_PROOF",
      "REQUEST_DOCUMENT",
      "DELIVERY_PROOF",
      "DELIVERY_DOCUMENT",
      "INSTITUTION_PHOTO",
      "FARMER_DOCUMENT",
    ])
    .optional(),
  requestId: z.string().optional(),
  offerId: z.string().optional(),
  institutionId: z.string().optional(),
  farmerId: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return err("Não autenticado.", 401)

  let body: unknown = {}
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return err("Payload inválido.", 400)

  const { apiKey, apiSecret, cloudName } = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder =
    parsed.data.purpose === "avatar"
      ? `alimapa/avatars/${session.user.id}`
      : (() => {
          const scope = parsed.data.scope || "REQUEST_PROOF"
          if (parsed.data.requestId) return `alimapa/evidence/${scope.toLowerCase()}/requests/${parsed.data.requestId}`
          if (parsed.data.offerId) return `alimapa/evidence/${scope.toLowerCase()}/offers/${parsed.data.offerId}`
          if (parsed.data.institutionId) return `alimapa/evidence/${scope.toLowerCase()}/institutions/${parsed.data.institutionId}`
          if (parsed.data.farmerId) return `alimapa/evidence/${scope.toLowerCase()}/farmers/${parsed.data.farmerId}`
          return `alimapa/evidence/${scope.toLowerCase()}/misc/${session.user.id}`
        })()

  const signature = cloudinarySign({ folder, timestamp }, apiSecret)

  return ok(
    {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      resourceType: parsed.data.resourceType,
    },
    { status: 200 },
  )
}



