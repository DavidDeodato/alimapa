/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

function daysFromNow(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}

async function main() {
  console.log("🌱 Seeding Alimapa...")

  // wipe (dev/demo)
  // ordem importa por causa de FKs
  await prisma.auditLog.deleteMany()
  await prisma.impactCredit.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.offerItem.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.agentRun.deleteMany()
  await prisma.agentConfig.deleteMany()
  await prisma.evidence.deleteMany()
  await prisma.deliveryConfirmation.deleteMany()
  await prisma.requestItem.deleteMany()
  await prisma.request.deleteMany()
  await prisma.company.deleteMany()
  await prisma.institution.deleteMany()
  await prisma.farmer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.municipality.deleteMany()

  const municipality = await prisma.municipality.create({
    data: {
      name: "Município de Brasília (Demo)",
      state: "DF",
      centerLat: -15.793889,
      centerLng: -47.882778,
    },
  })

  const demoPassword = await bcrypt.hash("demo1234", 10)

  // Usuários de demonstração (agora com email/senha para login real via NextAuth)
  const gestorUser = await prisma.user.create({
    data: {
      role: "GESTOR",
      displayName: "Gestor Municipal (Demo)",
      email: "gestor@demo.alimapa",
      passwordHash: demoPassword,
      municipalityId: municipality.id,
    },
  })
  const instituicaoUser = await prisma.user.create({
    data: {
      role: "INSTITUICAO",
      displayName: "Instituição (Demo)",
      email: "instituicao@demo.alimapa",
      passwordHash: demoPassword,
      municipalityId: municipality.id,
    },
  })
  const agricultorUser = await prisma.user.create({
    data: {
      role: "AGRICULTOR",
      displayName: "Agricultor (Demo)",
      email: "agricultor@demo.alimapa",
      passwordHash: demoPassword,
      municipalityId: municipality.id,
    },
  })
  const empresaUser = await prisma.user.create({
    data: {
      role: "EMPRESA",
      displayName: "Empresa (Demo)",
      email: "empresa@demo.alimapa",
      passwordHash: demoPassword,
      municipalityId: municipality.id,
    },
  })

  const company = await prisma.company.create({
    data: {
      userId: empresaUser.id,
      name: "Empresa Impacto S/A (Demo)",
    },
  })

  const institution1 = await prisma.institution.create({
    data: {
      userId: instituicaoUser.id,
      municipalityId: municipality.id,
      name: "Escola Municipal João Paulo II",
      type: "Escola",
      lat: -15.7942,
      lng: -47.889,
      address: "Asa Sul, Brasília - DF",
    },
  })
  const institution2 = await prisma.institution.create({
    data: {
      municipalityId: municipality.id,
      name: "Creche Municipal Pequenos Sonhos",
      type: "Creche",
      lat: -15.801,
      lng: -47.913,
      address: "Asa Norte, Brasília - DF",
    },
  })

  // Farmers (um deles é o agricultor logado)
  const baseFarmers = [
    {
      name: "João da Silva",
      products: ["Alface", "Tomate", "Cenoura"],
      cafStatus: "ATIVO",
      capacity: "200 kg/semana",
      lat: -15.79,
      lng: -47.9,
      address: "Sítio Boa Vista, Zona Rural - DF",
      phone: "(61) 98765-4321",
      userId: agricultorUser.id,
    },
    {
      name: "Maria Santos",
      products: ["Banana", "Mamão", "Abóbora"],
      cafStatus: "ATIVO",
      capacity: "150 kg/semana",
      lat: -15.83,
      lng: -47.88,
      address: "Chácara Sol Nascente, DF",
      phone: "(61) 99876-5432",
    },
    {
      name: "Pedro Oliveira",
      products: ["Batata", "Mandioca", "Milho"],
      cafStatus: "PENDENTE",
      capacity: "300 kg/semana",
      lat: -15.76,
      lng: -47.85,
      address: "Fazenda Santa Rita, DF",
      phone: "(61) 97654-3210",
    },
  ]

  // Add extra farmers for map density
  const extraNames = [
    "Ana Ferreira",
    "Carlos Lima",
    "Beatriz Souza",
    "Rafael Costa",
    "Juliana Alves",
    "Marcos Pereira",
    "Luciana Rocha",
    "Diego Martins",
  ]
  const extraProducts = [
    ["Couve", "Cheiro-verde", "Alface"],
    ["Feijão", "Milho", "Abóbora"],
    ["Laranja", "Banana", "Limão"],
    ["Tomate", "Pimentão", "Cebola"],
  ]
  extraNames.forEach((n, idx) => {
    baseFarmers.push({
      name: n,
      products: extraProducts[idx % extraProducts.length],
      cafStatus: idx % 3 === 0 ? "PENDENTE" : "ATIVO",
      capacity: `${120 + idx * 10} kg/semana`,
      lat: -15.79 + (idx - 4) * 0.01,
      lng: -47.88 + (idx - 4) * 0.01,
      address: `Zona Rural - DF (${idx + 1})`,
      phone: `(61) 9${8000 + idx}0-0000`,
    })
  })

  const farmers = await Promise.all(
    baseFarmers.map((f) =>
      prisma.farmer.create({
        data: {
          userId: f.userId || null,
          municipalityId: municipality.id,
          name: f.name,
          products: f.products,
          cafStatus: f.cafStatus,
          capacity: f.capacity,
          lat: f.lat,
          lng: f.lng,
          address: f.address,
          phone: f.phone,
        },
      }),
    ),
  )

  const loggedFarmer = farmers.find((f) => f.userId === agricultorUser.id)
  if (!loggedFarmer) throw new Error("Farmer logado não encontrado no seed")

  // Agent configs (1 municipal default + 1 específico do farmer logado)
  const defaultAgent = await prisma.agentConfig.create({
    data: {
      municipalityId: municipality.id,
      personality: "Profissional, empático e objetivo. Linguagem simples e respeitosa.",
      objectives: ["Maximizar aceitação de propostas", "Garantir entrega no prazo", "Manter relacionamento"],
      offerCalculation: "FIXED_PER_PRODUCT",
      fixedDiscounts: { alface: 15, tomate: 10, banana: 12 },
      instructions:
        "Sempre explique claramente quantidade, prazo e valor. Peça confirmação de capacidade. Se houver dúvida, proponha alternativa.",
      isActive: true,
    },
  })

  await prisma.agentConfig.create({
    data: {
      municipalityId: municipality.id,
      farmerId: loggedFarmer.id,
      farmerName: loggedFarmer.name,
      personality: "Direto e cordial, com foco em viabilidade logística.",
      objectives: ["Fechar acordo rápido", "Reduzir risco de atraso"],
      offerCalculation: "CUSTOM_PER_FARMER",
      customFormula: "valorMercado * 0.85",
      instructions: "Se o agricultor estiver inseguro, ofereça orientação e peça documentos aos poucos.",
      isActive: true,
    },
  })

  // Requests
  const req1 = await prisma.request.create({
    data: {
      municipalityId: municipality.id,
      institutionId: institution1.id,
      program: "PNAE",
      status: "SUBMITTED",
      urgency: 4,
      needByDate: daysFromNow(6),
      title: "Merenda - reposição semanal",
      justification: "Reposição da merenda escolar para 500 alunos.",
      address: institution1.address,
      lat: institution1.lat,
      lng: institution1.lng,
      items: {
        create: [
          { productName: "Alface", quantity: 50, unit: "kg" },
          { productName: "Tomate", quantity: 30, unit: "kg" },
        ],
      },
    },
  })

  const req2 = await prisma.request.create({
    data: {
      municipalityId: municipality.id,
      institutionId: institution2.id,
      program: "PNAE",
      status: "VALIDATED",
      urgency: 3,
      needByDate: daysFromNow(10),
      title: "Frutas - merenda",
      justification: "Reposição de frutas para a semana.",
      address: institution2.address,
      lat: institution2.lat,
      lng: institution2.lng,
      items: {
        create: [{ productName: "Banana", quantity: 100, unit: "kg" }],
      },
    },
  })

  // Offer + conversation seeded (para unread)
  const offer1 = await prisma.offer.create({
    data: {
      requestId: req2.id,
      farmerId: loggedFarmer.id,
      status: "SENT",
      proposedValue: 300,
      marketValue: 450,
      distanceKm: 8.5,
      items: {
        create: [{ productName: "Banana", quantity: 100, unit: "kg" }],
      },
    },
  })

  const conv1 = await prisma.conversation.create({
    data: {
      offerId: offer1.id,
      farmerId: loggedFarmer.id,
      agentConfigId: defaultAgent.id,
      status: "ACTIVE",
      unreadFarmer: 1,
      unreadManager: 0,
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            sender: "ASSISTANT",
            content:
              "Olá! Temos uma oportunidade no programa PNAE: 100kg de banana. Posso oferecer R$ 300 (abaixo do valor de mercado) com prazo em 10 dias. Você consegue atender?",
          },
          { sender: "FARMER", content: "Consigo sim. Qual o local de entrega?" },
          {
            sender: "ASSISTANT",
            content: "Entrega na Creche Municipal Pequenos Sonhos (Asa Norte). Se confirmar, eu envio para aprovação do gestor.",
            metadata: { source: "AGENT" },
          },
        ],
      },
    },
  })

  // Credit seeded (marketplace)
  const credit1 = await prisma.impactCredit.create({
    data: {
      municipalityId: municipality.id,
      farmerId: loggedFarmer.id,
      offerId: offer1.id,
      requestId: req2.id,
      institutionId: institution2.id,
      monetaryValue: 300,
      impactCredits: 150, // diferença do mercado (450-300) como crédito (demo)
      unitType: "Kg de alimentos frescos",
      status: "DISPONIVEL",
      program: "PNAE",
      backing: {
        requestId: req2.id,
        offerId: offer1.id,
        farmerId: loggedFarmer.id,
        deliveryConfirmedAt: new Date().toISOString(),
        evidenceUrls: [],
      },
      listedAt: new Date(),
    },
  })

  // one sold credit
  await prisma.impactCredit.create({
    data: {
      municipalityId: municipality.id,
      farmerId: farmers[1].id,
      offerId: offer1.id,
      requestId: req1.id,
      institutionId: institution1.id,
      monetaryValue: 450,
      impactCredits: 50,
      unitType: "Refeições escolares",
      status: "VENDIDO",
      program: "PNAE",
      backing: {
        requestId: req1.id,
        offerId: offer1.id,
        farmerId: farmers[1].id,
        deliveryConfirmedAt: new Date().toISOString(),
        evidenceUrls: [],
      },
      purchasedByCompanyId: company.id,
      purchasedAt: new Date(),
      listedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  })

  // audit samples
  await prisma.auditLog.createMany({
    data: [
      { actorUserId: instituicaoUser.id, action: "request.created", entityType: "Request", entityId: req1.id },
      { actorUserId: gestorUser.id, action: "request.validated", entityType: "Request", entityId: req2.id },
      { actorUserId: null, action: "offer.sent", entityType: "Offer", entityId: offer1.id, details: { conversationId: conv1.id } },
      { actorUserId: empresaUser.id, action: "credit.purchased", entityType: "ImpactCredit", entityId: credit1.id },
    ],
  })

  console.log("✅ Seed concluído.")
  console.log("Gestor:", gestorUser.id)
  console.log("Instituição:", instituicaoUser.id)
  console.log("Agricultor:", agricultorUser.id)
  console.log("Empresa:", empresaUser.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


