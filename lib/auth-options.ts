import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "dev-secret-alimapa",
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        role: { label: "Perfil", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const role = credentials?.role
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        if (role && String(role) !== String(user.role)) return null

        return {
          id: user.id,
          name: user.displayName,
          email: user.email ?? email,
          role: user.role,
          municipalityId: user.municipalityId ?? undefined,
          avatarUrl: user.avatarUrl ?? null,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.municipalityId = (user as any).municipalityId
        token.avatarUrl = (user as any).avatarUrl ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).municipalityId = token.municipalityId
        ;(session.user as any).avatarUrl = (token as any).avatarUrl ?? null
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
}


