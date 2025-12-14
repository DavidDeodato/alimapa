import { z } from "zod"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { err, ok } from "@/lib/api-response"
import { cloudinarySign, getCloudinaryConfig } from "@/lib/cloudinary"

const BodySchema = z.object({
  // opcional: se quiser segmentar por tipo de arquivo no futuro
  resourceType: z.enum(["image"]).optional().default("image"),
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
  const folder = `alimapa/avatars/${session.user.id}`

  const signature = cloudinarySign({ folder, timestamp }, apiSecret)

  return ok(
    {
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
    },
    { status: 200 },
  )
}


