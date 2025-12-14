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


