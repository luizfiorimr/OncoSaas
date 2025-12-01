# 📚 Índice da Documentação - OncoSaas

Bem-vindo à documentação completa da plataforma OncoSaas. Este índice ajudará você a navegar por toda a documentação disponível.

## 🚀 Início Rápido

**Novo no projeto? Comece aqui:**

1. [Estado Atual e Próximos Passos](desenvolvimento/estado-atual-proximos-passos.md) ⭐ **LEIA PRIMEIRO**
2. [Setup de Desenvolvimento](desenvolvimento/setup-desenvolvimento.md)
3. [Instalação Completa](desenvolvimento/instalacao-completa.md)
4. [Comandos Úteis](desenvolvimento/comandos-uteis.md)
5. [Quick Test Guide](desenvolvimento/quick-test-guide.md)

## 📖 Documentação por Categoria

### 🏗️ Arquitetura e Design

#### Visão Geral
- [Stack Tecnológico](arquitetura/stack-tecnologico.md) - Tecnologias utilizadas e justificativas
- [Estrutura de Dados](arquitetura/estrutura-dados.md) - Schema do banco de dados e relacionamentos
- [Integração HL7/FHIR](arquitetura/integracao-hl7-fhir.md) - Interoperabilidade com sistemas de saúde
- [Atualizações em Tempo Real (WebSocket)](arquitetura/realtime-updates.md) - Socket.io para notificações

#### Sistemas Específicos
- [Agente WhatsApp (IA)](arquitetura/agente-whatsapp.md) - Arquitetura do chatbot conversacional
- [Resumo Implementação Agente IA](arquitetura/resumo-implementacao-agente-ia.md)
- [Frontend de Conversa](arquitetura/frontend-conversa.md) - Interface de chat
- [Múltiplos Cânceres - Rastreio](arquitetura/multiplos-canceres-rastreio.md)
- [Armazenamento de Tokens Facebook](arquitetura/armazenamento-tokens-facebook.md)
- [Queries SQL N8N](arquitetura/queries-sql-n8n.md) - Automações

### 🛠️ Desenvolvimento

#### Setup e Configuração
- [Setup de Configuração](desenvolvimento/setup-configuracao.md) - Variáveis de ambiente e configuração
- [Arquivos de Configuração](desenvolvimento/arquivos-configuracao.md) - ESLint, Prettier, Husky
- [Frontend Setup](desenvolvimento/frontend-setup.md) - Next.js 14 específico
- [HTTPS Local para Embedded Signup](desenvolvimento/https-local-embedded-signup.md)
- [HTTPS Setup](desenvolvimento/https-setup.md)
- [Resumo de Configuração](desenvolvimento/resumo-configuracao.md)

#### Funcionalidades Implementadas
- [Navegação Oncológica - Implementação](desenvolvimento/navegacao-oncologica-implementacao.md)
- [Navegação Oncológica - Colorretal](desenvolvimento/navegacao-oncologica-colorretal.md)
- [Navegação Oncológica - Setup](desenvolvimento/navegacao-oncologica-setup.md)
- [Página de Navegação Oncológica](desenvolvimento/pagina-navegacao-oncologica.md)
- [Múltiplos Cânceres - Rastreio (Implementação)](desenvolvimento/multiplos-canceres-rastreio-implementacao.md)
- [Funcionalidades de Conversa](desenvolvimento/funcionalidades-conversa.md)
- [Sidebar de Detalhes](desenvolvimento/sidebar-detalhes.md)
- [Resizable Panels](desenvolvimento/resizable-panels.md)

#### Melhorias e Features
- [Badge de Alertas Críticos](desenvolvimento/badge-alertas-criticos-implementacao.md)
- [Busca Funcional](desenvolvimento/busca-funcional-implementacao.md)
- [Filtros Básicos](desenvolvimento/filtros-basicos-implementacao.md)
- [Ordenação por Prioridade](desenvolvimento/ordenacao-prioridade-implementacao.md)
- [Melhorias de UX](desenvolvimento/melhorias-ux-implementacao.md)
- [Scroll Automático](desenvolvimento/scroll-automatico-implementacao.md)
- [Scroll Automático - Feedback Assumido](desenvolvimento/scroll-automatico-feedback-assumido.md)
- [Clique em Alerta Abre Conversa](desenvolvimento/clique-alerta-abre-conversa.md)

#### Testes e Qualidade
- [Testar Endpoints](desenvolvimento/testar-endpoints.md)
- [Resultados de Testes API](desenvolvimento/resultados-testes-api.md)
- [Regenerar Prisma Client](desenvolvimento/regenerar-prisma-client.md)
- [Seed Data](desenvolvimento/seed-data.md)

#### Templates e Exemplos
- [Templates e Exemplos](desenvolvimento/templates-e-exemplos.md) - Código reutilizável

### 🗄️ Banco de Dados

- [PostgreSQL - Estrutura e Conexão](banco-dados/postgres-estrutura-e-conexao.md)
- [Quick Reference - Banco de Dados](banco-dados/QUICK_REFERENCE.md)

### 🚨 Sistema de Alertas

- [Como Funcionam os Alertas](sistema-alertas/como-funcionam-alertas.md)
- [Fluxo de Alertas](sistema-alertas/fluxo-alertas.md)
- [Agente IA - Criar Alerta](sistema-alertas/agente-ia-criar-alerta.md)
- [N8N - Criar Alerta no Postgres](sistema-alertas/n8n-criar-alerta-postgres.md)
- [Quick Reference - Alertas](sistema-alertas/QUICK_REFERENCE.md)

### 🤖 IA e Machine Learning

- [Protótipo de Priorização](ia-modelo-priorizacao/prototipo-priorizacao.md) - Modelo XGBoost

### 📊 Dashboard de Enfermagem

- [Wireframes do Dashboard](dashboard-enfermagem/wireframes-dashboard.md)
- [Análise Especialista](analise-dashboard/analise-especialista.md)
- [Melhorias Prioritárias](analise-dashboard/melhorias-prioritarias.md)

### 🎯 Product Discovery

- [Dashboard Nurse - Navegação Oncológica](product-discovery/dashboard-nurse-navegacao-oncologica.md)
- [Guia de Entrevistas](product-discovery/guia-entrevistas.md)
- [Template de Entrevista](product-discovery/template-entrevista.md)
- [Mapa de Dores](product-discovery/mapa-dores.md)

### 📦 MVP e Roadmap

- [MVP Features](mvp-scope/mvp-features.md) - Escopo do produto mínimo viável
- [Roadmap Visual](planejamento/roadmap-visual.md)
- [Plano de Desenvolvimento para Stakeholders](planejamento/plano-desenvolvimento-stakeholders.md)

### 💼 Apresentações e Pitch

- [Pitch Deck - Seed Round](pitch-deck/pitch-deck-seed-round.md)
- [Apresentação Executiva para Stakeholders](apresentacao/apresentacao-executiva-stakeholders.md)
- [Calculadora ROI](apresentacao/calculadora-roi.md)

### 📖 Casos de Uso

- [Casos de Uso Reais](casos-uso/casos-uso-reais.md) - Exemplos práticos de uso

### 🎬 Demo

- [Guia de Demo ao Vivo](demo/guia-demo-ao-vivo.md) - Como apresentar o produto

### 📋 Compliance e Legal

- [Checklist de Compliance](compliance-legal/checklist-compliance.md) - LGPD, ANVISA, HIPAA

### 🔗 Integrações

- [Integração FHIR - Completa](integracao-fhir-completa.md)
- [Integração FHIR - Explicação](integracao-fhir-explicacao.md)
- [Integração FHIR - Resumo](integracao-fhir-resumo.md)

### 📚 Materiais Educativos

#### Para Enfermeiros
- [Material para Enfermeiros](materiais/enfermeiros/material-enfermeiros.md)

#### Para Oncologistas
- [Material para Oncologistas](materiais/oncologistas/material-oncologistas.md)

## 🎓 Guias de Desenvolvimento (Regras do Cursor)

### Regras Gerais
- [Desenvolvimento Modular](../.cursor/rules/desenvolvimento-modular.mdc) - Princípios e boas práticas
- [Organização de Arquivos](../.cursor/rules/organizacao-arquivos.mdc)
- [Projeto de Medicina](../.cursor/rules/projeto-medicina.mdc)

### Frontend (Next.js)
- [Padrões Frontend](../.cursor/rules/frontend-padroes.mdc) - React, Next.js 14, Tailwind

### Backend (NestJS)
- [Padrões Backend](../.cursor/rules/backend-padroes.mdc) - NestJS, Prisma, PostgreSQL

### Especialidades Médicas (Raciocínio Clínico)
- [Template de Especialista](../.cursor/rules/template-especialista.mdc)
- [Oncologista](../.cursor/rules/oncologista.mdc)
- [Navegação Oncológica](../.cursor/rules/navegacao-oncologica.mdc)
- [Medicina de Família](../.cursor/rules/medicina-familia.mdc)
- [Clínica Médica](../.cursor/rules/clinica-medica.mdc)
- [Clínica Cirúrgica](../.cursor/rules/clinica-cirurgica.mdc)
- [Emergencista](../.cursor/rules/emergencista.mdc)
- [Pronto Socorro](../.cursor/rules/pronto-socorro.mdc)
- [Intensivista](../.cursor/rules/intensivista.mdc)

### Equipe SaaS Healthtech
- [Equipe SaaS Healthtech](../.cursor/rules/equipe-saas-healthtech.mdc) - Visão geral
- [Product Manager](../.cursor/rules/product-manager-healthtech.mdc)
- [Desenvolvedor](../.cursor/rules/desenvolvedor-saas-healthtech.mdc)
- [AI Engineer](../.cursor/rules/ai-engineer-healthtech.mdc)
- [Vendas/Marketing](../.cursor/rules/vendas-marketing-healthtech.mdc)
- [CEO/Estratégia](../.cursor/rules/ceo-estrategia-healthtech.mdc)
- [CFO/Operações](../.cursor/rules/cfo-operacoes-healthtech.mdc)

### Guardrails e Qualidade
- [Resumo de Guardrails](../.cursor/rules/GUARDRAILS-RESUMO.md)
- [Guardrail - Fontes Web](../.cursor/rules/guardrail-fontes-web.md)
- [Guardrail - Versão de Fontes](../.cursor/rules/guardrail-versao-fontes.md)
- [Atualizar Resumos](../.cursor/rules/atualizar-resumos.md)

## 🔍 Como Encontrar o Que Você Precisa

### Você é um novo desenvolvedor?
1. [Estado Atual e Próximos Passos](desenvolvimento/estado-atual-proximos-passos.md)
2. [Setup de Desenvolvimento](desenvolvimento/setup-desenvolvimento.md)
3. [Comandos Úteis](desenvolvimento/comandos-uteis.md)
4. [Padrões Frontend](../.cursor/rules/frontend-padroes.mdc) ou [Padrões Backend](../.cursor/rules/backend-padroes.mdc)

### Você precisa entender a arquitetura?
1. [Stack Tecnológico](arquitetura/stack-tecnologico.md)
2. [Estrutura de Dados](arquitetura/estrutura-dados.md)
3. [Atualizações em Tempo Real](arquitetura/realtime-updates.md)

### Você vai implementar uma feature?
1. [Templates e Exemplos](desenvolvimento/templates-e-exemplos.md)
2. [Navegação Oncológica - Implementação](desenvolvimento/navegacao-oncologica-implementacao.md)
3. [Desenvolvimento Modular](../.cursor/rules/desenvolvimento-modular.mdc)

### Você é Product Manager?
1. [Product Discovery](product-discovery/)
2. [MVP Features](mvp-scope/mvp-features.md)
3. [Roadmap Visual](planejamento/roadmap-visual.md)
4. [Product Manager Healthtech](../.cursor/rules/product-manager-healthtech.mdc)

### Você vai fazer uma apresentação?
1. [Pitch Deck](pitch-deck/pitch-deck-seed-round.md)
2. [Apresentação Executiva](apresentacao/apresentacao-executiva-stakeholders.md)
3. [Guia de Demo](demo/guia-demo-ao-vivo.md)

### Você precisa de contexto médico?
1. [Oncologista](../.cursor/rules/oncologista.mdc) - Raciocínio clínico oncológico
2. [Navegação Oncológica](../.cursor/rules/navegacao-oncologica.mdc) - Protocolos de navegação
3. [Material para Oncologistas](materiais/oncologistas/material-oncologistas.md)
4. [Material para Enfermeiros](materiais/enfermeiros/material-enfermeiros.md)

## 📝 Contribuindo com a Documentação

Ao adicionar nova documentação:

1. **Escolha o diretório correto** baseado na categoria
2. **Siga o padrão de nomenclatura**: `kebab-case.md`
3. **Adicione ao índice**: Atualize este arquivo (`INDEX.md`)
4. **Use markdown adequado**: Títulos, listas, código, links
5. **Seja claro e conciso**: Documentação é para ser lida e usada

## 🔗 Links Externos Úteis

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Última atualização**: 2024-01-XX  
**Versão da Documentação**: 1.0.0

Se você não encontrou o que procura, [abra uma issue no GitHub](https://github.com/luizfiorimr/OncoSaas/issues) ou contate a equipe.
