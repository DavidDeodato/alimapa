import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { err, ok } from "@/lib/api-response"

const Base = z.object({
  role: z.enum(["GESTOR", "INSTITUICAO", "AGRICULTOR", "EMPRESA"]),
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

const RegisterSchema = z.discriminatedUnion("role", [
  Base.extend({
    role: z.literal("GESTOR"),
    municipality: z.object({
      name: z.string().min(2),
      state: z.string().min(2).max(2),
      centerLat: z.number().optional(),
      centerLng: z.number().optional(),
    }),
  }),
  Base.extend({
    role: z.literal("INSTITUICAO"),
    municipalityId: z.string().optional(),
    institution: z.object({
      name: z.string().min(2),
      type: z.string().min(2),
      phone: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
  }),
  Base.extend({
    role: z.literal("AGRICULTOR"),
    municipalityId: z.string().optional(),
    farmer: z.object({
      name: z.string().min(2),
      phone: z.string().optional(),
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      cafStatus: z.enum(["ATIVO", "PENDENTE", "INATIVO"]),
      capacity: z.string().optional(),
      products: z.array(z.string().min(1)).default([]),
    }),
  }),
  Base.extend({
    role: z.literal("EMPRESA"),
    company: z.object({
      name: z.string().min(2),
    }),
  }),
])

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json(err("Payload inválido"), { status: 400 })

    const { email, password, displayName, role } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
    if (existing) return NextResponse.json(err("Email já cadastrado."), { status: 409 })

    const passwordHash = await bcrypt.hash(password, 10)

    if (role === "GESTOR") {
      const municipality = await prisma.municipality.create({
        data: {
          name: parsed.data.municipality.name,
          state: parsed.data.municipality.state,
          centerLat: parsed.data.municipality.centerLat,
          centerLng: parsed.data.municipality.centerLng,
        },
      })
      const user = await prisma.user.create({
        data: {
          role,
          displayName,
          email: normalizedEmail,
          passwordHash,
          municipalityId: municipality.id,
        },
      })
      return NextResponse.json(ok({ userId: user.id }), { status: 201 })
    }

    if (role === "INSTITUICAO") {
      const municipality = parsed.data.municipalityId
        ? await prisma.municipality.findUnique({ where: { id: parsed.data.municipalityId } })
        : await prisma.municipality.findFirst({ orderBy: { createdAt: "desc" } })
      if (!municipality) return NextResponse.json(err("Nenhum município disponível. Cadastre um gestor primeiro."), { status: 400 })

      const user = await prisma.user.create({
        data: {
          role,
          displayName,
          email: normalizedEmail,
          passwordHash,
          municipalityId: municipality.id,
          institution: {
            create: {
              name: parsed.data.institution.name,
              type: parsed.data.institution.type,
              phone: parsed.data.institution.phone,
              address: parsed.data.institution.address,
              lat: parsed.data.institution.lat,
              lng: parsed.data.institution.lng,
              municipalityId: municipality.id,
            },
          },
        },
      })
      return NextResponse.json(ok({ userId: user.id }), { status: 201 })
    }

    if (role === "AGRICULTOR") {
      const municipality = parsed.data.municipalityId
        ? await prisma.municipality.findUnique({ where: { id: parsed.data.municipalityId } })
        : await prisma.municipality.findFirst({ orderBy: { createdAt: "desc" } })
      if (!municipality) return NextResponse.json(err("Nenhum município disponível. Cadastre um gestor primeiro."), { status: 400 })

      const user = await prisma.user.create({
        data: {
          role,
          displayName,
          email: normalizedEmail,
          passwordHash,
          municipalityId: municipality.id,
          farmer: {
            create: {
              name: parsed.data.farmer.name,
              phone: parsed.data.farmer.phone,
              address: parsed.data.farmer.address,
              lat: parsed.data.farmer.lat,
              lng: parsed.data.farmer.lng,
              cafStatus: parsed.data.farmer.cafStatus,
              capacity: parsed.data.farmer.capacity,
              products: parsed.data.farmer.products,
              municipalityId: municipality.id,
            },
          },
        },
      })
      return NextResponse.json(ok({ userId: user.id }), { status: 201 })
    }

    // EMPRESA
    const user = await prisma.user.create({
      data: {
        role,
        displayName,
        email: normalizedEmail,
        passwordHash,
        company: {
          create: { name: parsed.data.company.name },
        },
      },
    })
    return NextResponse.json(ok({ userId: user.id }), { status: 201 })
  } catch (e: any) {
    return NextResponse.json(err("Erro interno ao cadastrar."), { status: 500 })
  }
}


