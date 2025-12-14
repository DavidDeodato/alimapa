import "server-only"

import { cookies } from "next/headers"
import type { DemoSession, UserRole } from "./types"

export async function getDemoSession(): Promise<DemoSession | null> {
  const cookieStore = await cookies()
  const role = cookieStore.get("alimapa_role")?.value as UserRole
  const userId = cookieStore.get("alimapa_user_id")?.value

  if (!role || !userId) {
    return null
  }

  return { role, userId }
}
