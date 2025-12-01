# 🏗️ Arquitetura do Sistema OncoSaas

## Visão Geral

O OncoSaas é uma plataforma SaaS multi-tenant para navegação oncológica inteligente. A arquitetura foi projetada para ser escalável, segura e em conformidade com regulamentações de saúde.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
├─────────────────┬─────────────────┬────────────────────────────────────────┤
│   Web Browser   │  WhatsApp App   │         EHR Systems (HL7/FHIR)         │
│   (Next.js)     │  (Business API) │                                        │
└────────┬────────┴────────┬────────┴───────────────────┬────────────────────┘
         │                 │                             │
         ▼                 ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                         │
│                            (AWS ALB / Nginx)                                │
└────────┬────────────────────────┬──────────────────────┬────────────────────┘
         │                        │                      │
         ▼                        ▼                      ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────────────┐
│    FRONTEND     │   │     BACKEND     │   │          AI SERVICE             │
│   (Next.js 14)  │   │    (NestJS)     │   │          (FastAPI)              │
│                 │   │                 │   │                                 │
│ • React 18+     │   │ • REST API      │   │ • Prioritization Models         │
│ • TypeScript    │   │ • WebSocket     │   │ • WhatsApp Agent (LLM)          │
│ • Tailwind CSS  │   │ • Multi-tenant  │   │ • RAG Pipeline                  │
│ • Zustand       │   │ • RBAC          │   │ • Speech-to-Text                │
│ • React Query   │   │ • Prisma ORM    │   │ • NLP Processing                │
└────────┬────────┘   └────────┬────────┘   └────────────────┬────────────────┘
         │                     │                             │
         │                     ▼                             │
         │       ┌─────────────────────────┐                 │
         │       │     MESSAGE QUEUE       │◄────────────────┘
         │       │   (RabbitMQ / Redis)    │
         │       └────────────┬────────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                       │
├────────────────────────┬────────────────────────┬───────────────────────────┤
│      PostgreSQL        │         Redis          │        Object Store       │
│   (Multi-tenant DB)    │   (Cache/Sessions)     │       (AWS S3)            │
│                        │                        │                           │
│ • Schema per Tenant    │ • Session Store        │ • Media Storage           │
│ • Encrypted at Rest    │ • Rate Limiting        │ • Audio Messages          │
│ • ACID Transactions    │ • Pub/Sub              │ • Documents               │
└────────────────────────┴────────────────────────┴───────────────────────────┘
```

---

## Componentes Principais

### 1. Frontend (Next.js 14)

**Localização**: `/frontend`

**Tecnologias**:
- Next.js 14 com App Router
- React 18+ com Server Components
- TypeScript para type safety
- Tailwind CSS + shadcn/ui para UI
- Zustand para estado global
- React Query (TanStack Query) para cache de servidor
- Socket.io Client para tempo real

**Estrutura**:
```
frontend/src/
├── app/                    # App Router (rotas)
│   ├── (auth)/            # Rotas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── oncology-navigation/ # Navegação oncológica
│   ├── patients/          # Gestão de pacientes
│   └── chat/              # Interface de conversas
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn)
│   └── dashboard/        # Componentes específicos
├── hooks/                 # Custom hooks
├── lib/                   # Utilitários e configurações
└── stores/               # Zustand stores
```

**Responsabilidades**:
- Interface de usuário responsiva
- Dashboard de enfermagem
- Visualização de conversas
- Gestão de pacientes
- Navegação oncológica visual

---

### 2. Backend (NestJS)

**Localização**: `/backend`

**Tecnologias**:
- NestJS (Node.js)
- TypeScript
- Prisma ORM
- class-validator / class-transformer
- JWT + OAuth 2.0
- Socket.io para WebSocket

**Arquitetura Modular**:
```
backend/src/
├── modules/
│   ├── alerts/           # Sistema de alertas
│   ├── auth/             # Autenticação e autorização
│   ├── dashboard/        # Métricas e dados do dashboard
│   ├── integrations/     # HL7/FHIR integrations
│   ├── internal-notes/   # Notas internas
│   ├── interventions/    # Histórico de intervenções
│   ├── messages/         # Mensagens WhatsApp
│   ├── observations/     # Observações clínicas
│   ├── oncology-navigation/ # Navegação oncológica
│   ├── patients/         # Gestão de pacientes
│   ├── questionnaire-responses/ # Respostas de questionários
│   ├── treatments/       # Tratamentos
│   ├── users/            # Gestão de usuários
│   └── whatsapp-connections/ # Conexões WhatsApp
├── common/               # Código compartilhado
│   ├── guards/          # Auth guards
│   ├── interceptors/    # Logging, transformação
│   └── decorators/      # Decorators customizados
├── gateways/            # WebSocket gateways
└── prisma/              # Prisma service
```

**Padrões**:
- **Módulos independentes**: Cada feature é um módulo NestJS completo
- **Injeção de dependência**: IoC container do NestJS
- **Guards para autenticação**: JWT + RBAC
- **DTOs para validação**: class-validator em todas as entradas

---

### 3. AI Service (FastAPI)

**Localização**: `/ai-service`

**Tecnologias**:
- Python 3.11+
- FastAPI
- scikit-learn + XGBoost (priorização)
- OpenAI/Anthropic API (LLM)
- sentence-transformers (embeddings)
- spaCy (NLP)

**Componentes**:
```
ai-service/src/
├── api/
│   └── routes/
│       ├── priority.py      # Cálculo de prioridade
│       ├── agent.py         # Agente WhatsApp
│       └── health.py        # Health check
├── models/
│   └── priority_model.py    # Modelo ML de priorização
├── agent/
│   ├── whatsapp_agent.py    # Lógica do agente
│   ├── rag.py               # Retrieval Augmented Generation
│   └── guardrails.py        # Validação de respostas
├── services/
│   └── llm_service.py       # Cliente LLM
└── schemas/
    └── priority.py          # Pydantic schemas
```

**Funcionalidades**:
1. **Priorização Inteligente**: ML model que calcula score de risco (0-100)
2. **Agente Conversacional**: LLM com RAG para responder pacientes
3. **Processamento de Linguagem**: Extração de sintomas, intenção
4. **Speech-to-Text**: Transcrição de áudios do WhatsApp

---

## Multi-Tenancy

### Estratégia: Schema por Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                     │
├───────────────────┬─────────────────┬───────────────────────┤
│  tenant_hospital_a│ tenant_hospital_b│   tenant_clinic_c    │
│                   │                  │                       │
│ • patients        │ • patients       │ • patients            │
│ • messages        │ • messages       │ • messages            │
│ • users           │ • users          │ • users               │
│ • alerts          │ • alerts         │ • alerts              │
│ • ...             │ • ...            │ • ...                 │
└───────────────────┴─────────────────┴───────────────────────┘
```

**Implementação**:
- Cada tenant tem schema separado no PostgreSQL
- `tenantId` obrigatório em todas as queries
- Middleware valida tenant em cada requisição
- Isolamento completo de dados entre clientes

**Código**:
```typescript
// Sempre incluir tenantId em queries
const patients = await this.prisma.patient.findMany({
  where: { 
    tenantId: req.user.tenantId // OBRIGATÓRIO
  }
});
```

---

## Comunicação em Tempo Real

### WebSocket com Socket.io

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Backend   │◀────│  AI Service │
│  Socket.io  │     │   Gateway   │     │             │
│   Client    │◀────│             │────▶│  Processing │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌───────────┐
                    │   Redis   │
                    │  Pub/Sub  │
                    └───────────┘
```

**Namespaces**:
- `/alerts`: Alertas críticos em tempo real
- `/conversations`: Novas mensagens
- `/dashboard`: Atualizações de métricas

**Rooms**:
- `tenant:{tenantId}`: Isolamento por tenant
- `patient:{patientId}`: Atualizações de paciente específico

---

## Fluxo de Dados

### Fluxo de Mensagem WhatsApp

```
┌─────────────┐
│   Paciente  │
│  (WhatsApp) │
└──────┬──────┘
       │ 1. Envia mensagem
       ▼
┌─────────────┐
│  WhatsApp   │
│ Business API│
└──────┬──────┘
       │ 2. Webhook
       ▼
┌─────────────┐     ┌─────────────┐
│   Backend   │────▶│    Queue    │
│  (NestJS)   │     │  (RabbitMQ) │
└──────┬──────┘     └──────┬──────┘
       │                   │
       │ 3. Persiste       │ 4. Processa
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ PostgreSQL  │     │ AI Service  │
│             │     │  (FastAPI)  │
└─────────────┘     └──────┬──────┘
                           │ 5. Gera resposta
                           ▼
                    ┌─────────────┐
                    │    LLM      │
                    │ (GPT/Claude)│
                    └──────┬──────┘
                           │ 6. Resposta
                           ▼
                    ┌─────────────┐
                    │  WhatsApp   │
                    │    API      │
                    └──────┬──────┘
                           │ 7. Entrega
                           ▼
                    ┌─────────────┐
                    │   Paciente  │
                    └─────────────┘
```

---

## Segurança

### Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────┐
│                        TLS 1.3                               │
│                    (Encrypted Transit)                       │
├─────────────────────────────────────────────────────────────┤
│                    Authentication                            │
│              JWT + OAuth 2.0 + MFA                          │
├─────────────────────────────────────────────────────────────┤
│                    Authorization                             │
│                  RBAC (Role-Based)                          │
├─────────────────────────────────────────────────────────────┤
│                   Multi-Tenancy                              │
│               Tenant Isolation Guards                        │
├─────────────────────────────────────────────────────────────┤
│                   Data Encryption                            │
│               AES-256 (At Rest)                             │
├─────────────────────────────────────────────────────────────┤
│                   Audit Logging                              │
│              5-Year Retention (LGPD)                        │
└─────────────────────────────────────────────────────────────┘
```

**Roles do Sistema**:
- `admin`: Acesso total ao tenant
- `oncologist`: Visualização e decisões clínicas
- `nurse`: Operações de navegação e comunicação
- `manager`: Relatórios e gestão

---

## Infraestrutura (Produção)

### AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐     ┌─────────────────────────────────┐   │
│  │ CloudFront  │────▶│          ALB (Load Balancer)    │   │
│  │    (CDN)    │     └───────────────┬─────────────────┘   │
│  └─────────────┘                     │                      │
│                                      ▼                      │
│                      ┌───────────────────────────────┐     │
│                      │         ECS / EKS              │     │
│                      │  ┌─────────┐ ┌─────────────┐  │     │
│                      │  │Frontend │ │   Backend   │  │     │
│                      │  │(Next.js)│ │  (NestJS)   │  │     │
│                      │  └─────────┘ └─────────────┘  │     │
│                      │  ┌─────────────────────────┐  │     │
│                      │  │      AI Service         │  │     │
│                      │  │      (FastAPI)          │  │     │
│                      │  └─────────────────────────┘  │     │
│                      └───────────────────────────────┘     │
│                                      │                      │
│              ┌───────────────────────┼───────────────────┐ │
│              ▼                       ▼                   ▼ │
│  ┌─────────────────┐   ┌─────────────────┐  ┌───────────┐ │
│  │   RDS Aurora    │   │   ElastiCache   │  │    S3     │ │
│  │  (PostgreSQL)   │   │    (Redis)      │  │ (Storage) │ │
│  └─────────────────┘   └─────────────────┘  └───────────┘ │
│                                                              │
│  ┌─────────────────┐   ┌─────────────────┐                  │
│  │   CloudWatch    │   │ Secrets Manager │                  │
│  │  (Monitoring)   │   │   (Credentials) │                  │
│  └─────────────────┘   └─────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Diagrama ER Simplificado

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Tenant    │──────▶│    User     │       │   Patient   │◀──┐
│             │       │             │       │             │   │
│ • id        │       │ • tenantId  │       │ • tenantId  │   │
│ • name      │       │ • email     │       │ • name      │   │
│ • domain    │       │ • role      │       │ • phone     │   │
└─────────────┘       └─────────────┘       └──────┬──────┘   │
                                                   │          │
                      ┌────────────────────────────┤          │
                      │                            │          │
                      ▼                            ▼          │
               ┌─────────────┐              ┌─────────────┐   │
               │   Message   │              │PatientJourney│   │
               │             │              │             │   │
               │ • patientId │              │ • patientId │   │
               │ • content   │              │ • stage     │   │
               │ • direction │              │ • cancerType│   │
               └─────────────┘              └──────┬──────┘   │
                                                   │          │
                                                   ▼          │
                                            ┌─────────────┐   │
                                            │NavigationStep│   │
                                            │             │   │
                                            │ • journeyId │   │
                                            │ • status    │   │
                                            │ • stepType  │   │
                                            └─────────────┘   │
                                                              │
┌─────────────┐       ┌─────────────┐       ┌─────────────┐   │
│    Alert    │──────▶│ Observation │       │PriorityScore│───┘
│             │       │             │       │             │
│ • patientId │       │ • patientId │       │ • patientId │
│ • type      │       │ • type      │       │ • score     │
│ • severity  │       │ • value     │       │ • category  │
└─────────────┘       └─────────────┘       └─────────────┘
```

Para o schema completo, consulte: [`/backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)

---

## Integrações

### WhatsApp Business API

```
OncoSaas ◀───────▶ WhatsApp Cloud API (Meta)
                        │
                        ├── Webhooks (incoming messages)
                        ├── Send Messages API
                        └── Media API (audio, images)
```

### HL7/FHIR (Sistemas Hospitalares)

```
OncoSaas ◀───────▶ FHIR Server
                        │
                        ├── Patient Resource
                        ├── Observation Resource
                        └── Condition Resource

OncoSaas ◀───────▶ HL7 v2 (MLLP)
                        │
                        ├── ADT Messages
                        ├── ORU Messages (Results)
                        └── ORM Messages (Orders)
```

---

## Decisões Arquiteturais

### ADR 001: Modular Monolith First

**Decisão**: Iniciar com monólito modular no backend antes de migrar para microserviços.

**Razão**: 
- Menor complexidade operacional no início
- Facilita refatoração
- Módulos NestJS já são independentes

### ADR 002: Schema per Tenant

**Decisão**: Usar um schema PostgreSQL por tenant para isolamento de dados.

**Razão**:
- Isolamento completo de dados
- Compliance com LGPD
- Backup/restore por tenant

### ADR 003: AI Service Separado

**Decisão**: Manter serviço de IA em Python separado do backend Node.js.

**Razão**:
- Melhor ecossistema de ML em Python
- Escalabilidade independente
- Especialização de equipe

---

## Performance

### Estratégias de Cache

1. **Redis Cache**: Sessões, tokens, dados frequentes
2. **React Query**: Cache client-side de dados do servidor
3. **CDN**: Assets estáticos via CloudFront

### Otimizações de Banco

1. **Índices**: Em campos de busca frequente (`tenantId`, `patientId`)
2. **Paginação**: Obrigatória em todas as listas
3. **Connection Pooling**: PgBouncer em produção

---

## Monitoramento

### Métricas Principais

- **Latência de API**: p50, p95, p99
- **Taxa de erro**: Por endpoint
- **WebSocket connections**: Ativas/Tenant
- **Tempo de resposta do AI**: Por modelo
- **Fila de mensagens**: Depth e processing time

### Ferramentas

- **CloudWatch**: Logs e métricas AWS
- **Sentry**: Error tracking
- **Prometheus/Grafana**: Métricas customizadas (planejado)

---

## Referências

- [Stack Tecnológico Detalhado](./arquitetura/stack-tecnologico.md)
- [Estrutura de Dados](./arquitetura/estrutura-dados.md)
- [API Documentation](./API.md)
- [Security Practices](./SECURITY.md)
