import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import CreditDetailClient from "./credit-detail-client"

export default async function CreditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "EMPRESA") redirect("/auth/login")
  return <CreditDetailClient id={id} />
}


