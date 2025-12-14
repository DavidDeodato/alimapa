# Alimapa — Memory Bank (CONTEXT)

## Contexto / Tese
**Alimapa** é uma plataforma de **orquestração territorial** para conectar **demanda pública (PNAE/PAA/outros)** com **oferta de agricultura familiar**, com foco em **segurança alimentar**, **eficiência logística** e **transparência**.

## Stack (atual do repo)
- **Next.js (App Router)**: v16.x com Turbopack; usa **`proxy.ts`** como middleware (não `middleware.ts`).
- **Postgres (Neon)** + **Prisma**
- **NextAuth (Credentials)**: autenticação real (email/senha).

## Papéis (RBAC)
- **GESTOR**: visão territorial, valida requisições, roda orquestração, acompanha conversas, auditoria.
- **INSTITUICAO**: cria requisições (itens, urgência, prazo), acompanha status.
- **AGRICULTOR**: recebe propostas/ofertas, conversa no chat, aceita/recusa, emite/lista créditos.
- **EMPRESA**: compra créditos no marketplace (simulado).

## Regras de sessão e redirecionamento
- O guard de rotas é feito em **`proxy.ts`** via token do **NextAuth**.
- `/` redireciona para o “home” do papel:
  - GESTOR → `/m/painel`
  - INSTITUICAO → `/i/nova-requisicao`
  - AGRICULTOR → `/f/propostas`
  - EMPRESA → `/c/marketplace`
- Não logado → `/auth/login`

## UX — Entrada / Login
- A tela `/demo` foi desativada (redirect para `/auth/login`).
- O login (`/auth/login`) tem seletor **“Sou”** (role). Se o email existir com role diferente, mostra erro “perfil incompatível”.
- Em áreas autenticadas, existe botão **Sair** no topo (encerra sessão NextAuth).

## Contas demo (seed)
O seed cria usuários demo com senha padrão:
- `gestor@demo.alimapa`
- `instituicao@demo.alimapa`
- `agricultor@demo.alimapa`
- `empresa@demo.alimapa`
- Senha: `demo1234`

## APIs (já existentes no repo)
- Auth:
  - `POST /api/auth/register` (cadastro)
  - `GET|POST /api/auth/[...nextauth]` (NextAuth)
- Gestor:
  - `GET /api/m/dashboard`
  - `POST /api/requests/:id/validate`
  - `POST /api/requests/:id/orchestrate`
- Agricultor:
  - `GET /api/f/credits`
  - `POST /api/f/credits/:id/list`

## Pendências abertas (alto nível)
- **Desmock** do frontend: páginas ainda exibem dados mockados; devem consumir as APIs reais.
- **Desmock** do backend: ampliar cobertura de rotas (chat, ofertas, marketplace, etc.) conforme chamadas reais do frontend.
- **Script demo** e validação e2e do fluxo completo.

## Debug / Observações
- `POST /api/auth/register`: quando o payload é inválido, a API retorna `details` com os erros do Zod (path/message) para facilitar ajuste de contrato.

- **Deploy Vercel — pnpm lockfile**: a Vercel falha com `ERR_PNPM_OUTDATED_LOCKFILE` quando `pnpm-lock.yaml` não está sincronizado com `package.json` (ex.: deps adicionadas e lockfile não atualizado). Mitigação rápida no repo (sem mexer na Vercel): adicionar `.npmrc` com `frozen-lockfile=false` (e `prefer-frozen-lockfile=false`) para permitir `pnpm install` em CI mesmo com lockfile desatualizado.

- **Next 16 (App Router) — params Promise**: rotas dinâmicas em `app/api/**/[id]/route.ts` podem receber `params` como **Promise**. Se o handler acessa `params.id` direto, o `id` vira `undefined` e o Prisma quebra (ex.: `GET /api/conversations/:id/messages`). Padronizar para:
  - `export async function GET(req, { params }: { params: Promise<{ id: string }> }) { const { id } = await params }`
  - Validar `id` e retornar 400 ao invés de 500.

## Mudanças recentes (changelog resumido)
- Agricultores (Gestor): desmock completo com APIs reais
  - `GET /api/m/farmers` (lista)
  - `GET /api/m/farmers/:id` (detalhe)
  - UI `/m/agricultores` e `/m/agricultores/:id` agora consomem API (sem dados mockados).

- Auditoria (Gestor): desmock + API real
  - `GET /api/m/audit` (paginação via cursor + filtro por `actionPrefix`)
  - UI `/m/auditoria` agora lista logs reais
  - Helper `lib/audit.ts` centraliza escrita de logs sem quebrar o fluxo principal.

- Propostas (Agricultor): APIs reais + UI sem mock
  - `GET /api/f/offers` (lista)
  - `GET /api/f/offers/:id` (detalhe)
  - `POST /api/f/offers/:id/accept` e `/decline`
  - UI `/f/propostas`, `/f/propostas/:id` e `/f/propostas/:id/chat` agora consomem API (inclui aceitar/recusar).

- Agentes (Gestor): tipos NEGOTIATOR vs VALIDATOR
  - Prisma: `AgentType` + `AgentConfig.type` + `AgentConfig.validatorConfig`
  - `/m/agents` permite criar/editar por tipo (campos de validador aparecem quando selecionado)
  - Orquestrador de propostas usa apenas agentes `NEGOTIATOR` (evita selecionar validador por engano).


