# Requisitos Funcionais — Alimapa

## Contexto

Os **requisitos funcionais** do **Alimapa** descrevem as **funções essenciais do sistema** para cumprir seu propósito central: **orquestrar a cadeia pública de segurança alimentar**, conectando demanda institucional, oferta da agricultura familiar e decisão municipal **com conformidade legal, rastreabilidade e eficiência operacional**.

Esses requisitos garantem que o MVP entregue um **fluxo ponta-a-ponta demonstrável** — da criação do pedido até a confirmação da entrega e emissão de impacto — respeitando princípios de **governança pública, simplicidade operacional e auditoria por design**.

---

## Requisitos Funcionais

| **Código** | **Requisito** | **Descrição / Objetivo** |
|-------------|----------------|---------------------------|
| **RF01 – Criação de Pedido Institucional** | Permitir que escolas/ONGs criem pedidos de alimentos. | Pedido simples com itens, quantidades, programa (PNAE/PAA) e prazo desejado. |
| **RF02 – Submissão e Validação do Pedido** | Permitir validação pelo gestor municipal. | Pedido só avança após validação explícita (com log). |
| **RF03 – Execução do Orquestrador** | Rodar o Agente Orquestrador sob demanda. | Aplicar regras determinísticas de elegibilidade e priorização legal. |
| **RF04 – Geração Automática de Propostas (Offers)** | Criar propostas para agricultores elegíveis. | Considerar distância, capacidade, CAF e hierarquia legal. |
| **RF05 – Comunicação com Agricultor** | Enviar propostas via chat interno. | Linguagem simples; resposta binária (Aceitar/Recusar). |
| **RF06 – Aceite ou Recusa de Propostas** | Permitir decisão do agricultor. | Registrar resposta e avançar estado da oferta. |
| **RF07 – Aprovação da Proposta pelo Gestor** | Permitir decisão final do gestor municipal. | Escolha justificada e registrada em AuditLog. |
| **RF08 – Geração Automática de Documentos** | Criar Projeto de Venda e minuta de NF. | Preenchimento automático a partir dos dados do pedido/oferta. |
| **RF09 – Acompanhamento da Entrega** | Monitorar status de fornecimento. | Estado **FULFILLING** até confirmação da instituição. |
| **RF10 – Confirmação de Recebimento** | Permitir upload de evidência pela instituição. | Foto/checklist para validar entrega (**DELIVERED**). |
| **RF11 – Encerramento do Pedido** | Fechar o pedido após validação final. | Alterar estado para **CLOSED**. |
| **RF12 – Emissão de Crédito de Impacto** | Gerar certificado de impacto. | Emitido apenas após pedido concluído e evidenciado. |
| **RF13 – AuditLog Obrigatório** | Registrar todas as ações críticas. | Logs imutáveis para auditoria e prestação de contas. |
| **RF14 – RBAC Estrito** | Controlar acesso por papel. | Gestor, agricultor, instituição e empresa veem apenas o necessário. |
| **RF15 – Visualização Territorial** | Exibir dados em mapa. | Apoiar decisões com contexto geográfico. |
| **RF16 – Explicabilidade da Decisão** | Gerar justificativas claras. | IA explica *por que* produtores foram sugeridos/selecionados. |
| **RF17 – Marketplace de Créditos de Impacto** | Permitir visualização por empresas. | Acesso apenas a dados agregados e anonimizados. |
| **RF18 – Coleta de Métricas Operacionais** | Monitorar uso e desempenho do sistema. | Dados de pedidos, tempo de orquestração, taxa de aceite e impacto. |

---

## Observações Importantes

- O **Alimapa não gerencia pagamentos** - apenas registra estados e evidências.
- A **IA não decide regras legais** - apenas executa e explica decisões codificadas.
- Todo avanço de estado gera **rastreabilidade e justificativa**.
- O fluxo é fechado e determinístico, garantindo previsibilidade e segurança jurídica.


