import { z } from "zod"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("email")?.toLowerCase().trim()

  const parsed = z.string().email().safeParse(email)
  if (!parsed.success) return err("Email inválido.", 400)

  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { id: true, role: true },
  })

  return ok({ exists: !!user, role: user?.role ?? null })
}


