# 🏗️ Arquitetura do Sistema

Esta seção contém toda a documentação sobre a arquitetura técnica do OncoSaas.

## 📋 Visão Geral

O OncoSaas é uma plataforma SaaS multi-tenant construída com arquitetura de microsserviços, composta por três serviços principais:

1. **Frontend** (Next.js 14) - Interface do usuário
2. **Backend** (NestJS) - API REST e WebSocket
3. **AI Service** (FastAPI) - Processamento de IA/ML

## 🗂️ Documentos Disponíveis

### Fundamentos
- [Stack Tecnológico](stack-tecnologico.md) - Tecnologias, frameworks e bibliotecas utilizadas
- [Estrutura de Dados](estrutura-dados.md) - Modelos de dados, schema Prisma, relacionamentos

### Integrações
- [Integração HL7/FHIR](integracao-hl7-fhir.md) - Padrões de interoperabilidade em saúde
- [Agente WhatsApp](agente-whatsapp.md) - Arquitetura do agente conversacional
- [Armazenamento Tokens Facebook](armazenamento-tokens-facebook.md) - Segurança OAuth

### Comunicação
- [Atualizações em Tempo Real](realtime-updates.md) - WebSocket, Socket.io, eventos
- [Frontend Conversa](frontend-conversa.md) - Interface de conversação

### Funcionalidades
- [Resumo Implementação Agente IA](resumo-implementacao-agente-ia.md) - Visão geral do agente
- [Múltiplos Cânceres Rastreio](multiplos-canceres-rastreio.md) - Suporte a diferentes tipos
- [Queries SQL N8N](queries-sql-n8n.md) - Automações e workflows

## 🎯 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │  Conversas   │  │  Navegação   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────────────────────┬──────────────────────────────────────┘
                        │ HTTP/REST + WebSocket
┌──────────────────────┴──────────────────────────────────────┐
│                    Backend (NestJS)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Patients   │  │  Alerts      │  │  WhatsApp    │      │
│  │   Module     │  │  Module      │  │  Module      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Navigation  │  │  FHIR        │  │  WebSocket   │      │
│  │  Module      │  │  Integration │  │  Gateway     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└──────┬──────────────────────┬──────────────────────┬────────┘
       │                      │                      │
       │ HTTP                 │ HTTP                 │
       │                      │                      │
┌──────┴──────────┐  ┌───────┴──────────┐  ┌───────┴──────────┐
│  PostgreSQL      │  │  AI Service     │  │  WhatsApp       │
│  (Prisma)        │  │  (FastAPI)      │  │  Business API    │
│                  │  │                  │  │                  │
│  - Patients      │  │  - Priority     │  │  - Messages      │
│  - Alerts        │  │  - Agent        │  │  - Webhooks      │
│  - Navigation    │  │  - RAG          │  │                  │
└──────────────────┘  └─────────────────┘  └──────────────────┘
```

## 🔑 Conceitos Principais

### Multi-Tenancy
- Isolamento de dados por `tenantId`
- Schema compartilhado com filtros por tenant
- Validação obrigatória em todas as queries

### Segurança
- JWT para autenticação
- Criptografia de dados sensíveis (LGPD)
- RBAC (Role-Based Access Control)
- Auditoria completa de ações

### Escalabilidade
- Arquitetura de microsserviços
- Cache com Redis
- Filas com RabbitMQ
- WebSocket para tempo real

### Compliance
- LGPD (Lei Geral de Proteção de Dados)
- ANVISA (SaMD - Software as Medical Device)
- HL7/FHIR para interoperabilidade
- Auditoria e logs imutáveis

## 📚 Próximos Passos

1. Leia [Stack Tecnológico](stack-tecnologico.md) para entender as tecnologias
2. Explore [Estrutura de Dados](estrutura-dados.md) para ver os modelos
3. Veja [Integração HL7/FHIR](integracao-hl7-fhir.md) para interoperabilidade
4. Consulte [Atualizações em Tempo Real](realtime-updates.md) para WebSocket

---

**Última atualização**: 2024-01-XX
