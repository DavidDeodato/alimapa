# LGPD 

## Contextualização

A **Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)** é um pilar estrutural na concepção do **Alimapa**, garantindo que a inovação tecnológica e o uso de **Inteligência Artificial** na gestão pública ocorram de forma **ética, segura e compatível com a responsabilidade institucional**.

Como o Alimapa atua como uma **infraestrutura B2G de orquestração da cadeia pública de segurança alimentar**, ele lida com dados de **gestores públicos**, **agricultores familiares**, **instituições demandantes** e **empresas ESG** - exigindo um modelo rigoroso de **governança de dados**, **controle de acesso** e **auditabilidade**.

Desde sua concepção, o Alimapa adota o princípio de **Privacy by Design**, incorporando a proteção de dados **diretamente na arquitetura**, nos fluxos de negócio e nas regras de acesso (RBAC), e não como uma camada posterior.

---

## Princípios Fundamentais Aplicados

&emsp;O **Alimapa** segue integralmente os princípios da LGPD, com adaptações específicas ao contexto de políticas públicas e compras institucionais:

| **Princípio** | **Descrição** | **Como é Aplicado no Alimapa** |
|----------------|----------------|--------------------------------|
| **Finalidade** | Tratamento com propósito legítimo e explícito. | Dados usados exclusivamente para **execução, auditoria e rastreabilidade** do PNAE/PAA e programas correlatos. |
| **Necessidade** | Coleta mínima de dados. | O sistema coleta apenas dados **operacionais essenciais** . |
| **Transparência** | Clareza sobre uso e acesso aos dados. | Interfaces deixam explícito **quem vê o quê**, conforme o papel do usuário. |
| **Segurança** | Proteção contra acessos indevidos e vazamentos. | Criptografia, controle de acesso por papel e logs imutáveis. |
| **Prevenção** | Mitigação de riscos antes que ocorram danos. | Separação entre dados sensíveis, operacionais e analíticos. |
| **Não Discriminação** | Vedação de usos discriminatórios. | A IA não infere renda, gênero, etnia ou perfil social; apenas aplica regras legais explícitas. |
| **Responsabilização** | Capacidade de comprovar conformidade. | Todas as ações críticas geram **AuditLog**, permitindo fiscalização. |

---

## Mecanismos de Segurança e Conformidade

A arquitetura do **Alimapa** incorpora mecanismos técnicos e organizacionais alinhados às melhores práticas da LGPD:

### 🔐 Proteção e Criptografia de Dados
- Dados criptografados **em trânsito (TLS)** e **em repouso**.
- Infraestrutura cloud segura (Neon + Vercel).
- Separação entre dados operacionais, documentos e evidências.

### 🕵️ Minimização e Controle de Acesso
- Agricultores compartilham apenas **dados mínimos** (ex.: CPF parcial, status CAF).
- Instituições **não têm acesso** a documentos sensíveis de agricultores.
- Empresas ESG visualizam apenas **dados agregados e anonimizados** de impacto.

### 🧭 Consentimento e Base Legal
- Tratamento de dados fundamentado em:
  - **execução de políticas públicas**;
  - **interesse público**;
  - **consentimento explícito**, quando aplicável (ex.: uso em municípios vizinhos).
- Consentimento pode ser **revogado**, respeitando limites legais de retenção pública.

### 🧠 Governança Ética de IA
- A IA:
  - não decide elegibilidade;
  - não define preços;
  - não executa pagamentos.
- Modelos são usados via API, sem retenção permanente de dados pessoais.
- Prompts e fluxos são projetados para **explicabilidade e neutralidade**.

### 🧾 Auditoria e Rastreabilidade
- Toda ação sensível gera um **AuditLog imutável**:
  - quem acessou;
  - quando;
  - qual entidade;
  - antes/depois.
- Essencial para controle interno, tribunais de contas e órgãos fiscalizadores.

---

## Direitos dos Titulares Garantidos

O **Alimapa** assegura o exercício dos direitos previstos na LGPD, respeitando as particularidades da administração pública:

| **Direito** | **Descrição** | **Como é Assegurado** |
|--------------|----------------|-----------------------|
| **Acesso** | Consulta aos dados tratados. | Visualização via painel ou solicitação administrativa. |
| **Correção** | Ajuste de dados incorretos. | Atualização assistida ou solicitação ao gestor. |
| **Anonimização** | Redução de identificabilidade quando possível. | Uso de identificadores parciais e dados agregados. |
| **Informação** | Saber como e por que os dados são usados. | Políticas claras e fluxos explicáveis no sistema. |
| **Revogação de consentimento** | Quando aplicável. | Configurações de uso e compartilhamento controladas pelo titular. |

> ⚠️ Observação:  
> Em contextos de política pública, alguns dados devem ser retidos por obrigação legal, mesmo após solicitação de exclusão.

---

## Conformidade Legal e Responsabilidade Pública

&emsp;O **Alimapa** não trata a LGPD apenas como exigência legal, mas como **fundamento de confiança institucional**.

- **Privacy by Design**: proteção incorporada desde a modelagem dos dados.
- **Privacy by Default**: coleta mínima e acesso restrito por padrão.
- **RBAC estrito**: cada ator acessa apenas o necessário.
- **IA assistiva, não decisória**: preservação do controle humano e jurídico.


