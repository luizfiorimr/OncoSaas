# 🏗️ Arquitetura do Sistema OncoSaas

Este documento descreve a arquitetura completa da plataforma OncoSaas, incluindo componentes, fluxos de dados, integrações e decisões de design.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura de Alto Nível](#arquitetura-de-alto-nível)
- [Componentes Principais](#componentes-principais)
- [Fluxo de Dados](#fluxo-de-dados)
- [Multi-Tenancy](#multi-tenancy)
- [Segurança](#segurança)
- [Integrações](#integrações)
- [Escalabilidade](#escalabilidade)
- [Decisões de Design](#decisões-de-design)

## Visão Geral

OncoSaas é uma plataforma SaaS multi-tenant para navegação oncológica que integra:

- **Frontend moderno** (Next.js 14) para profissionais de saúde
- **Backend robusto** (NestJS) com lógica de negócio e APIs
- **Serviço de IA** (FastAPI) com modelos ML e agente conversacional
- **Banco de dados** PostgreSQL com isolamento por tenant
- **Integrações** com WhatsApp Business API e sistemas de saúde (HL7/FHIR)
- **Tempo real** via WebSocket (Socket.io) para notificações instantâneas

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 14)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Dashboard  │  │   Conversa   │  │  Navegação Oncológica  │ │
│  │ Enfermagem  │  │   WhatsApp   │  │                        │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│         │                 │                      │               │
│         └─────────────────┴──────────────────────┘               │
│                           │                                      │
│                      HTTPS/WSS                                   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                  BACKEND (NestJS)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   API Gateway                             │   │
│  │  (Guards: JWT, Tenant, Roles)                            │   │
│  └────┬─────────────────────────────────────────────────┬───┘   │
│       │                                                  │       │
│  ┌────▼─────────┐  ┌──────────────┐  ┌─────────────────▼───┐   │
│  │   Patients   │  │  Navigation  │  │      Alerts         │   │
│  │   Module     │  │   Module     │  │      Module         │   │
│  └────┬─────────┘  └──────┬───────┘  └─────────────────┬───┘   │
│       │                   │                             │       │
│  ┌────▼───────────────────▼─────────────────────────────▼───┐   │
│  │              Prisma ORM (Database Layer)               │   │
│  └────────────────────────┬───────────────────────────────┘   │
│                            │                                   │
│  ┌─────────────────────────▼───────────────────────────────┐   │
│  │              WebSocket Gateway (Socket.io)             │   │
│  │      (Alertas, Conversas, Priorização em Tempo Real)  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                       PostgreSQL                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Schema 1: tenant_a  │  Schema 2: tenant_b  │  Schema N  │   │
│  │  (Hospital A)        │  (Clínica B)         │  ...       │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                   AI SERVICE (FastAPI)                           │
│  ┌────────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ Agente WhatsApp│  │ Priorização   │  │       RAG        │   │
│  │ (GPT-4/Claude) │  │  (XGBoost)    │  │ (Conhecimento)   │   │
│  └────────────────┘  └───────────────┘  └──────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────────┐
│                 INTEGRAÇÕES EXTERNAS                             │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │   WhatsApp   │  │   HL7/FHIR  │  │  Sistemas Externos   │   │
│  │ Business API │  │  Servers    │  │  (EHR, PMS, etc.)    │   │
│  └──────────────┘  └─────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. Frontend (Next.js 14)

**Tecnologias:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query (@tanstack/query)
- Socket.io Client
- Zustand (state management)

**Responsabilidades:**
- Interface do usuário para profissionais de saúde
- Dashboard de enfermagem com visualização de pacientes
- Interface de conversa WhatsApp
- Navegação oncológica (etapas, alertas)
- Autenticação e autorização (JWT)
- Notificações em tempo real (WebSocket)

**Estrutura:**
```
frontend/src/
├── app/                    # App Router (rotas)
│   ├── dashboard/          # Dashboard principal
│   ├── chat/               # Conversa WhatsApp
│   ├── patients/           # Gestão de pacientes
│   └── oncology-navigation/# Navegação oncológica
├── components/             # Componentes React
│   ├── ui/                 # Componentes básicos (shadcn)
│   ├── dashboard/          # Componentes do dashboard
│   └── shared/             # Componentes compartilhados
├── hooks/                  # Custom hooks
├── lib/                    # Utilitários e APIs
│   ├── api/                # Clientes de API
│   └── utils/              # Funções utilitárias
└── stores/                 # Zustand stores
```

### 2. Backend (NestJS)

**Tecnologias:**
- NestJS (Node.js + TypeScript)
- Prisma ORM
- PostgreSQL
- Socket.io (WebSocket)
- JWT (autenticação)
- class-validator (validação)

**Responsabilidades:**
- API REST para todas as operações
- Lógica de negócio e validações
- Gerenciamento de multi-tenancy
- Autenticação e autorização (Guards)
- WebSocket para notificações em tempo real
- Integração com AI Service
- Integração com sistemas externos (HL7/FHIR)

**Estrutura:**
```
backend/src/
├── modules/                # Módulos NestJS por feature
│   ├── auth/               # Autenticação
│   ├── patients/           # Gestão de pacientes
│   ├── conversations/      # Conversas WhatsApp
│   ├── navigation/         # Navegação oncológica
│   ├── alerts/             # Sistema de alertas
│   └── users/              # Gestão de usuários
├── common/                 # Código compartilhado
│   ├── guards/             # Guards (Auth, Tenant, Roles)
│   ├── interceptors/       # Interceptors
│   └── filters/            # Exception filters
├── prisma/                 # Prisma service
└── config/                 # Configurações
```

**Módulos Principais:**

- **PatientsModule**: CRUD de pacientes, busca, filtros
- **ConversationsModule**: Gestão de conversas WhatsApp, mensagens
- **NavigationModule**: Etapas de navegação oncológica, protocolos
- **AlertsModule**: Criação e gerenciamento de alertas, notificações
- **AuthModule**: Login, JWT, refresh tokens
- **UsersModule**: Gestão de usuários e permissões (RBAC)

### 3. AI Service (FastAPI)

**Tecnologias:**
- Python 3.11+
- FastAPI
- LangChain
- OpenAI GPT-4 / Anthropic Claude
- XGBoost (modelo de priorização)
- ChromaDB (vetores para RAG)
- Pydantic (validação)

**Responsabilidades:**
- Agente conversacional WhatsApp (LLM + RAG)
- Priorização inteligente de pacientes (ML)
- Extração de informações de conversas
- Geração de respostas contextualizadas
- Speech-to-Text (áudio → texto)

**Estrutura:**
```
ai-service/src/
├── api/                    # Rotas FastAPI
│   └── routes/
│       ├── agent.py        # Agente WhatsApp
│       ├── priority.py     # Priorização
│       └── health.py       # Health check
├── agent/                  # Lógica do agente
│   ├── whatsapp_agent.py   # Agente principal
│   ├── rag.py              # RAG (retrieval)
│   ├── guardrails.py       # Validação de respostas
│   └── stt.py              # Speech-to-Text
├── models/                 # Modelos ML
│   └── priority_model.py   # Modelo XGBoost
├── services/               # Serviços auxiliares
│   ├── llm_service.py      # Cliente LLM
│   └── embeddings.py       # Embeddings
└── schemas/                # Pydantic schemas
```

### 4. Banco de Dados (PostgreSQL)

**Modelo de Dados Principal:**

```sql
-- Multi-tenancy: Cada tenant tem schema próprio
CREATE SCHEMA tenant_hospital_a;
CREATE SCHEMA tenant_clinica_b;

-- Dentro de cada schema:
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255),
  date_of_birth DATE,
  email VARCHAR(255),
  phone VARCHAR(50),
  cancer_type VARCHAR(100),
  journey_stage VARCHAR(50),
  priority_score INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  patient_id UUID REFERENCES patients(id),
  whatsapp_number VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  sender_type VARCHAR(50), -- 'patient' | 'agent' | 'human'
  content TEXT,
  timestamp TIMESTAMP
);

CREATE TABLE navigation_steps (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  patient_id UUID REFERENCES patients(id),
  step_type VARCHAR(100),
  step_name VARCHAR(255),
  expected_date DATE,
  completion_date DATE,
  status VARCHAR(50), -- 'pending' | 'in_progress' | 'completed' | 'delayed'
  created_at TIMESTAMP
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  patient_id UUID REFERENCES patients(id),
  alert_type VARCHAR(50), -- 'critical' | 'urgent' | 'info'
  title VARCHAR(255),
  description TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);
```

**Isolamento por Tenant:**
- Cada tenant (hospital/clínica) tem schema separado
- Middleware valida `tenantId` em todas as queries
- Impossível acessar dados de outro tenant

## Fluxo de Dados

### 1. Fluxo de Conversa WhatsApp

```
Paciente (WhatsApp)
    │
    ▼
WhatsApp Business API
    │
    ▼
Backend (Webhook)
    │
    ├──▶ Salva mensagem no DB
    │
    └──▶ Encaminha para AI Service
         │
         ▼
    AI Service (Agente)
         │
         ├──▶ RAG: Busca contexto relevante
         ├──▶ LLM: Gera resposta (GPT-4/Claude)
         ├──▶ Guardrails: Valida resposta
         │
         ▼
    Retorna resposta
         │
         ▼
Backend
    │
    ├──▶ Salva resposta no DB
    ├──▶ Envia via WebSocket para Frontend
    │
    └──▶ Envia para WhatsApp API
         │
         ▼
Paciente recebe resposta
```

### 2. Fluxo de Priorização

```
Backend
    │
    └──▶ Dados do paciente (sintomas, exames, tempo)
         │
         ▼
    AI Service
         │
         └──▶ Modelo XGBoost
              │
              ├─ Features: sintomas, estadiamento, tempo de atraso
              ├─ Predição: score 0-100
              │
              ▼
         Retorna: { score: 85, category: 'high' }
         │
         ▼
Backend
    │
    ├──▶ Atualiza paciente no DB
    │
    └──▶ WebSocket: notifica Frontend
         │
         ▼
Frontend atualiza lista de pacientes
```

### 3. Fluxo de Alertas

```
Sistema de Alertas (Background Job)
    │
    └──▶ Verifica etapas atrasadas (CRON)
         │
         ├─ Etapa com expected_date < hoje?
         ├─ Status != 'completed'?
         │
         ▼
    Cria alerta no DB
         │
         ▼
Backend
    │
    └──▶ WebSocket: notifica Frontend
         │
         ▼
Frontend
    │
    ├──▶ Badge de alertas atualizado
    ├──▶ Notificação visual
    │
    └──▶ Som/vibração (opcional)
```

## Multi-Tenancy

### Estratégia: Schema por Tenant

**Por que Schema por Tenant?**
- ✅ Isolamento completo de dados (segurança máxima)
- ✅ Backup e restore por tenant
- ✅ Migração de tenant facilitada
- ✅ Compliance com LGPD/HIPAA

**Implementação:**

```typescript
// Middleware de Tenant (NestJS)
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    
    if (!tenantId) {
      throw new ForbiddenException('Tenant ID missing');
    }
    
    // Anexa tenantId ao request
    request.tenantId = tenantId;
    return true;
  }
}

// Todas as queries incluem tenantId
const patients = await prisma.patient.findMany({
  where: { tenantId }, // SEMPRE presente
});
```

## Segurança

### 1. Autenticação (JWT)

```typescript
// Login retorna access token + refresh token
{
  accessToken: 'eyJhbGc...',  // Expira em 15 min
  refreshToken: 'eyJhbGc...', // Expira em 7 dias
  user: {
    id: 'uuid',
    email: 'user@example.com',
    tenantId: 'tenant-uuid',
    roles: ['nurse', 'admin']
  }
}
```

### 2. Autorização (RBAC)

**Roles:**
- `admin`: Acesso total
- `oncologist`: Visualiza tudo, cria pacientes, não gerencia usuários
- `nurse`: Visualiza, edita pacientes, conversa WhatsApp
- `manager`: Relatórios, métricas

```typescript
@Roles('nurse', 'oncologist')
@Get('patients')
async findAll() {
  // Apenas nurses e oncologistas
}
```

### 3. Criptografia

- **Em trânsito**: TLS 1.3 (HTTPS)
- **Em repouso**: Dados sensíveis criptografados (AES-256)
- **Conversas**: Armazenadas criptografadas
- **Senhas**: bcrypt (10 rounds)

### 4. Auditoria

Todas as ações são registradas:

```typescript
{
  userId: 'uuid',
  tenantId: 'uuid',
  action: 'UPDATE_PATIENT',
  resource: 'patient:uuid',
  timestamp: '2024-01-XX',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...'
}
```

## Integrações

### 1. WhatsApp Business API

**Webhook para receber mensagens:**

```typescript
@Post('webhook')
async handleWebhook(@Body() body: WhatsAppWebhookDto) {
  const message = body.entry[0].changes[0].value.messages[0];
  
  // Salvar mensagem
  await this.conversationsService.saveMessage(message);
  
  // Enviar para IA
  const response = await this.aiService.generateResponse(message);
  
  // Enviar resposta via WhatsApp
  await this.whatsappService.sendMessage(response);
}
```

### 2. HL7/FHIR

**Interoperabilidade com sistemas de saúde:**

```typescript
// Receber paciente de sistema externo (FHIR)
@Post('fhir/patient')
async receiveFHIRPatient(@Body() fhirPatient: FHIRPatient) {
  const patient = this.fhirMapper.toInternal(fhirPatient);
  return this.patientsService.create(patient);
}

// Exportar paciente para sistema externo
@Get('fhir/patient/:id')
async exportFHIRPatient(@Param('id') id: string) {
  const patient = await this.patientsService.findOne(id);
  return this.fhirMapper.toFHIR(patient);
}
```

## Escalabilidade

### 1. Horizontal Scaling

**Frontend:**
- Deploy em CDN (Vercel, AWS CloudFront)
- Static generation onde possível
- ISR (Incremental Static Regeneration)

**Backend:**
- Múltiplas instâncias (Kubernetes)
- Load balancer (NGINX, AWS ALB)
- Stateless (JWT, sem sessão no servidor)

**AI Service:**
- Múltiplas instâncias
- Queue para processamento (RabbitMQ, AWS SQS)

**Database:**
- Read replicas (PostgreSQL)
- Connection pooling (PgBouncer)
- Caching (Redis)

### 2. Caching

```typescript
// Cache de dados frequentes (Redis)
@Injectable()
export class PatientsService {
  async findAll(tenantId: string) {
    const cacheKey = `patients:${tenantId}`;
    
    // Tentar cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Se não, buscar DB
    const patients = await this.prisma.patient.findMany({
      where: { tenantId },
    });
    
    // Cachear por 5 minutos
    await this.cache.set(cacheKey, patients, 5 * 60);
    
    return patients;
  }
}
```

### 3. Rate Limiting

```typescript
// Limitar requisições por IP/usuário
@UseGuards(ThrottlerGuard)
@Throttle(100, 60) // 100 req/min
@Controller('patients')
export class PatientsController {}
```

## Decisões de Design

### 1. Por que Next.js 14 (App Router)?

- ✅ SSR + SSG para performance
- ✅ Server Components (menos JavaScript no cliente)
- ✅ File-based routing (organização clara)
- ✅ API routes integradas
- ✅ Otimização automática de imagens

### 2. Por que NestJS?

- ✅ Estrutura modular (escalável)
- ✅ TypeScript first-class
- ✅ Dependency Injection (testabilidade)
- ✅ Decorators (código limpo)
- ✅ WebSocket integrado

### 3. Por que Prisma?

- ✅ Type-safety total
- ✅ Migrations automáticas
- ✅ Query builder intuitivo
- ✅ Multi-schema (multi-tenancy)

### 4. Por que FastAPI (AI Service)?

- ✅ Python (ecossistema ML/AI)
- ✅ Async (alta performance)
- ✅ Pydantic (validação automática)
- ✅ OpenAPI/Swagger integrado

### 5. Por que PostgreSQL?

- ✅ ACID completo
- ✅ JSON support (flexibilidade)
- ✅ Full-text search
- ✅ Schemas (multi-tenancy)
- ✅ Replicação robusta

## Diagramas Adicionais

### Diagrama de Sequência: Login

```
Usuario → Frontend: Clica "Login"
Frontend → Backend: POST /auth/login { email, password }
Backend → Database: Busca usuário
Database → Backend: Retorna usuário
Backend → Backend: Valida senha (bcrypt)
Backend → Backend: Gera JWT (access + refresh)
Backend → Frontend: { accessToken, refreshToken, user }
Frontend → Frontend: Salva tokens (localStorage)
Frontend → Frontend: Redireciona para /dashboard
```

### Diagrama de Sequência: Notificação de Alerta

```
Background Job → Database: Busca etapas atrasadas
Database → Background Job: Retorna etapas
Background Job → Database: Cria alertas
Database → Background Job: Confirmação
Background Job → Backend (WebSocket): Emite evento 'new_alert'
Backend (WebSocket) → Frontend: Envia alerta via WebSocket
Frontend → Frontend: Atualiza badge + notificação visual
```

## Monitoramento e Observabilidade

### Métricas Importantes

- **Performance**: Response time, throughput
- **Erros**: Taxa de erro por endpoint
- **Negócio**: Conversas ativas, alertas criados, taxa de priorização
- **Infraestrutura**: CPU, memória, disk I/O

### Ferramentas Recomendadas

- **APM**: Datadog, New Relic
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Uptime**: UptimeRobot, Pingdom
- **Alertas**: PagerDuty, Opsgenie

---

**Próximos Passos:**
- [API Reference](API_REFERENCE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Troubleshooting](TROUBLESHOOTING.md)

**Última atualização**: 2024-01-XX  
**Versão**: 1.0.0
