# Requisitos Não Funcionais 

## Contexto

Os **requisitos não funcionais** do **Alimapa** definem os **atributos de qualidade, segurança, desempenho, governança e confiabilidade institucional** que o sistema deve atender para operar como uma **infraestrutura pública digital**.

Enquanto os requisitos funcionais descrevem **o que o Alimapa faz** (orquestrar pedidos, propostas e entregas), os requisitos não funcionais estabelecem **como o sistema deve se comportar** para garantir:

- **segurança jurídica e conformidade legal**;
- **confiança institucional e auditabilidade**;
- **simplicidade operacional para usuários não técnicos**;
- **escalabilidade territorial e sustentabilidade pública**.

Esses requisitos são críticos para um projeto **B2G**, onde falhas não geram apenas bugs - geram **risco institucional**.

---

## Requisitos Não Funcionais

| **Código** | **Categoria** | **Requisito** | **Descrição / Objetivo** |
|-------------|----------------|----------------|---------------------------|
| **RNF01** | **Usabilidade** | Interface orientada à decisão | O sistema deve priorizar **clareza decisória**, com dashboards objetivos para gestores e fluxos simples para agricultores e instituições. |
| **RNF02** | **Acessibilidade Operacional** | Baixo letramento digital | Agricultores devem interagir com **respostas binárias (Sim/Não)** e textos curtos, sem necessidade de navegação complexa. |
| **RNF03** | **Compatibilidade** | Web-first e multiplataforma | O sistema deve funcionar integralmente em **navegadores modernos**, inclusive em dispositivos de baixo desempenho. |
| **RNF04** | **Segurança da Informação** | Proteção e segregação de dados | Dados devem ser **criptografados**, com separação clara entre dados sensíveis, operacionais e analíticos, conforme LGPD. |
| **RNF05** | **Privacidade** | Minimização de dados | Coleta apenas de dados **estritamente necessários** para execução do PNAE/PAA; sem exposição indevida entre atores. |
| **RNF06** | **Governança** | RBAC estrito | Cada papel (Gestor, Agricultor, Instituição, Empresa) deve acessar **somente o necessário** para sua função. |
| **RNF07** | **Escalabilidade** | Crescimento territorial | A arquitetura deve permitir **ativação de novos municípios** sem degradação de desempenho ou aumento exponencial de custo. |
| **RNF08** | **Desempenho** | Tempo de resposta operacional | Orquestrações e ações críticas devem responder em **tempo compatível com operação pública** (minutos, não horas). |
| **RNF09** | **Disponibilidade** | Alta disponibilidade | O sistema deve manter **≥ 99% de uptime** em ambiente cloud serverless. |
| **RNF10** | **Explicabilidade** | Decisões compreensíveis | Toda recomendação ou sugestão do sistema deve conter **justificativa legível e rastreável**. |
| **RNF11** | **Auditabilidade** | Logs imutáveis | Todas as ações críticas devem gerar **AuditLog**, com registro de ator, ação e contexto. |
| **RNF12** | **Confiabilidade** | Fluxo determinístico | O sistema deve impedir saltos indevidos de estado, respeitando a **máquina de estados oficial**. |
| **RNF13** | **Manutenibilidade** | Código modular e documentado | O código deve permitir evolução incremental (novos programas, regras ou territórios) sem refatorações extensas. |
| **RNF14** | **Ética e IA Responsável** | IA não decisória | A IA deve **nunca decidir elegibilidade, prioridade legal ou orçamento**, apenas executar, explicar e redigir. |
| **RNF15** | **Transparência Pública** | Comunicação clara do papel da IA | O sistema deve indicar explicitamente quando um texto, sugestão ou documento foi gerado com auxílio de IA. |

---

