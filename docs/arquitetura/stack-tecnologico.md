# Stack Tecnológico - Plataforma de Otimização Oncológica

## Visão Geral

SaaS multi-tenant para otimização de processos oncológicos com agente de IA conversacional no WhatsApp.

## Stack Definido

### Frontend

**Framework**: Next.js 14 (App Router)

- **Linguagem**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui (componentes acessíveis)
- **State Management**: Zustand ou React Query
- **Formulários**: React Hook Form + Zod (validação)
- **Gráficos**: Recharts ou Chart.js
- **Autenticação Client**: NextAuth.js

**Justificativa**:

- Next.js oferece SSR/SSG para performance
- TypeScript para type safety
- Tailwind para desenvolvimento rápido
- shadcn/ui para componentes acessíveis prontos

### Backend

**Framework**: NestJS (Node.js)

- **Linguagem**: TypeScript
- **ORM**: Prisma
- **Validação**: class-validator, class-transformer
- **Autenticação**: JWT + OAuth 2.0
- **API**: REST + WebSocket (Socket.io)
- **Tempo Real**: Socket.io para alertas, conversas e atualizações

**Justificativa**:

- NestJS oferece estrutura modular e escalável
- TypeScript em todo o stack
- Prisma para type-safe database queries
- JWT para autenticação stateless

### Banco de Dados

**Principal**: PostgreSQL 15+

- **Multi-tenant**: Schema por tenant (isolamento de dados)
- **Backup**: Automático diário com georedundância
- **Migrations**: Prisma Migrate
- **Cache**: Redis (sessões, cache de queries frequentes)

**Justificativa**:

- PostgreSQL: robusto, ACID, suporte a JSON
- Schema por tenant: isolamento de dados crítico para saúde
- Redis: cache de alta performance

### IA e Machine Learning

**Framework**: Python 3.11+

- **API**: FastAPI
- **ML**: scikit-learn, XGBoost
- **NLP**: spaCy, transformers (Hugging Face)
- **LLM**: OpenAI API (GPT-4) ou Anthropic API (Claude)
- **Embeddings**: sentence-transformers (para RAG)
- **STT**: Google Cloud Speech-to-Text ou AWS Transcribe

**Justificativa**:

- Python: ecossistema rico para ML/NLP
- FastAPI: alta performance, async
- XGBoost: modelos de priorização eficientes
- GPT-4/Claude: LLMs de estado da arte

### Integração WhatsApp

**API**: WhatsApp Business API

- **Provider**: Evolution API ou integração direta com Meta
- **Mensageria**: RabbitMQ ou Redis Queue (para filas de mensagens)
- **Webhook**: Endpoint seguro para receber mensagens
- **Rate Limiting**: Respeitar limites do WhatsApp

**Justificativa**:

- WhatsApp Business API: oficial, confiável
- Evolution API: facilita integração, mas pode considerar direto
- RabbitMQ: robusto para filas de mensagens

### Integração HL7/FHIR

**HL7 v2**: MLLP (Minimum Lower Layer Protocol)

- **Biblioteca**: node-hl7 (Node.js) ou Python HL7
- **FHIR**: REST API
- **Biblioteca**: fhir-py (Python) ou fhir.js (Node.js)
- **Transformação**: Serviço dedicado para conversão HL7 v2 ↔ FHIR

**Justificativa**:

- HL7 v2: ainda muito usado em sistemas legados
- FHIR: padrão moderno, JSON/REST
- Serviço de transformação: isolamento de complexidade

### Infraestrutura

**Cloud Provider**: AWS (preferencial) ou GCP

- **Compute**: EC2 (backend) ou ECS/EKS (containers)
- **Database**: RDS PostgreSQL (managed)
- **Storage**: S3 (conversas, logs, backups)
- **Cache**: ElastiCache Redis
- **CDN**: CloudFront (frontend estático)
- **Load Balancer**: ALB/NLB
- **Monitoring**: CloudWatch + Datadog/New Relic

**CI/CD**:

- **Git**: GitHub
- **CI**: GitHub Actions
- **CD**: Deploy automático para staging/production
- **Containerização**: Docker + Docker Compose (desenvolvimento)

**Justificativa**:

- AWS: robusto, escalável, compliance (HIPAA-ready)
- Managed services: reduz operacional overhead
- CI/CD: deploy rápido e seguro

### Segurança e Compliance

**Criptografia**:

- **Trânsito**: TLS 1.3 (HTTPS obrigatório)
- **Repouso**: AES-256 (banco de dados)
- **Secrets**: AWS Secrets Manager ou HashiCorp Vault

**Autenticação**:

- **Método**: OAuth 2.0 + JWT
- **MFA**: Obrigatório para profissionais de saúde
- **Sessions**: Redis (stateless JWT)

**Auditoria**:

- **Logs**: CloudWatch Logs (imutáveis)
- **Retenção**: 5 anos (LGPD)
- **Tracking**: Log de todas as ações (quem, quando, o quê)

**Justificativa**:

- TLS 1.3: criptografia moderna
- AES-256: padrão para dados sensíveis
- MFA obrigatório: segurança adicional para dados de saúde

## Arquitetura de Microserviços

### Serviços Principais

1. **API Gateway** (NestJS)
   - Roteamento de requisições
   - Autenticação/autorização
   - Rate limiting
   - Logging

2. **Serviço de Pacientes** (NestJS)
   - CRUD de pacientes
   - Navegação de pacientes
   - Integração com EHR

3. **Serviço de Priorização** (Python/FastAPI)
   - Modelo de ML para priorização
   - Cálculo de scores
   - API REST para consultas

4. **Serviço de Agente WhatsApp** (Python/FastAPI)
   - Processamento de mensagens
   - LLM para conversas
   - RAG para conhecimento médico
   - Detecção de sintomas críticos

5. **Serviço de Integração** (NestJS)
   - HL7 v2 MLLP
   - FHIR REST
   - Transformação de dados
   - Sincronização bidirecional

6. **Serviço de Notificações** (NestJS)
   - Alertas em tempo real
   - Push notifications
   - Email/SMS (opcional)

### Comunicação Entre Serviços

- **Síncrono**: HTTP REST (API Gateway ↔ Serviços)
- **Assíncrono**: RabbitMQ ou AWS SQS (eventos, filas)
- **Cache compartilhado**: Redis

## Diagrama de Arquitetura

```
[Frontend Next.js]
    ↓ HTTPS
[API Gateway (NestJS)]
    ↓
    ├─→ [Serviço Pacientes] ←→ [PostgreSQL]
    ├─→ [Serviço Priorização] ←→ [PostgreSQL]
    ├─→ [Serviço Agente WhatsApp] ←→ [Redis Queue] ←→ [WhatsApp API]
    ├─→ [Serviço Integração] ←→ [HL7/FHIR] ←→ [EHR External]
    └─→ [Serviço Notificações] ←→ [Redis]

[Agente WhatsApp Service]
    ↓
    ├─→ [LLM API (GPT-4/Claude)]
    ├─→ [RAG Vector DB] ←→ [Embeddings]
    └─→ [STT API (Google/AWS)]
```

## Estrutura de Dados Multi-Tenant

### Schema por Tenant

**Abordagem**: Schema isolation (um schema PostgreSQL por tenant)

**Estrutura**:

```
database: ONCONAV_production
├─ schema: tenant_hospital_1
│  ├─ patients
│  ├─ conversations
│  ├─ alerts
│  └─ ...
├─ schema: tenant_hospital_2
│  ├─ patients
│  ├─ conversations
│  └─ ...
└─ schema: shared
   ├─ tenants (metadados)
   └─ users (cross-tenant, apenas para auth)
```

**Justificativa**:

- Isolamento completo de dados (LGPD crítico)
- Backup/restore por tenant
- Compliance facilitado
- Escalabilidade (pode mover schemas para outros DBs)

## Decisões de Arquitetura

### Monolito vs Microserviços

- **Decisão**: Começar com monolito modular (NestJS), evoluir para microserviços
- **Justificativa**: MVP mais rápido, menos complexidade operacional inicial

### Banco de Dados

- **Decisão**: PostgreSQL (schema por tenant)
- **Alternativas consideradas**: MongoDB (rejeitado: menos robusto para dados estruturados críticos)

### Cache

- **Decisão**: Redis
- **Uso**: Sessões, cache de queries frequentes, filas de mensagens WhatsApp

### LLM

- **Decisão**: GPT-4 ou Claude (via API)
- **Alternativas**: Modelos open-source (Llama, Mistral) - considerar para custos
- **Estratégia**: Começar com API, avaliar open-source depois

## Próximos Passos

1. Definir estrutura de diretórios do projeto
2. Setup inicial do repositório (Next.js + NestJS)
3. Configurar banco de dados (PostgreSQL + Prisma)
4. Setup de CI/CD (GitHub Actions)
5. Configurar ambiente de desenvolvimento (Docker Compose)
