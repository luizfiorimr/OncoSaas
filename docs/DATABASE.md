# 🗄️ Modelo de Dados - OncoSaas

Este documento descreve o modelo de dados do OncoSaas, incluindo entidades, relacionamentos e convenções.

---

## Visão Geral

O OncoSaas utiliza **PostgreSQL 15+** como banco principal com **Prisma ORM** para mapeamento objeto-relacional.

### Multi-Tenancy

O sistema implementa isolamento de dados por tenant (hospital/clínica) usando:

- **Campo `tenantId`** em todas as tabelas
- **Índices compostos** incluindo tenant
- **Guards de validação** no backend

```sql
-- Toda query DEVE filtrar por tenant
SELECT * FROM patients WHERE tenant_id = 'tenant_uuid' AND ...
```

---

## Diagrama ER

```
┌─────────────┐      ┌─────────────────┐      ┌────────────┐
│   Tenant    │──1:N─│      User       │──1:N─│   Alert    │
└─────────────┘      └─────────────────┘      └────────────┘
       │                    │                       │
       │                    │ M:N (via Note)        │
       │                    ▼                       │
       │             ┌────────────┐                 │
       │──1:N──────▶│  Patient   │◀────────────────┘
       │             └────────────┘
       │                    │
       │                    ├──1:N──▶ Message
       │                    │
       │                    ├──1:N──▶ Conversation
       │                    │
       │                    ├──1:1──▶ PatientJourney
       │                    │              │
       │                    │              └──1:N──▶ NavigationStep
       │                    │
       │                    ├──1:N──▶ PriorityScore
       │                    │
       │                    └──1:N──▶ InternalNote
       │
       └──1:N──────▶ WhatsAppConnection
```

---

## Entidades Principais

### Tenant (Inquilino)

Representa um hospital ou clínica cliente.

```prisma
model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique
  domain    String?
  settings  Json     @default("{}")
  active    Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users               User[]
  patients            Patient[]
  whatsAppConnections WhatsAppConnection[]
  alerts              Alert[]

  @@map("tenants")
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `name` | String | Nome do hospital/clínica |
| `slug` | String | Identificador URL-friendly (único) |
| `domain` | String? | Domínio customizado (opcional) |
| `settings` | JSON | Configurações específicas |
| `active` | Boolean | Tenant ativo/inativo |

---

### User (Usuário)

Profissionais de saúde que acessam o sistema.

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  password     String
  name         String
  role         UserRole  @default(NURSE)
  tenantId     String    @map("tenant_id")
  refreshToken String?   @map("refresh_token")
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  tenant           Tenant         @relation(fields: [tenantId], references: [id])
  internalNotes    InternalNote[]
  interventions    Intervention[]
  alertsAssigned   Alert[]        @relation("AlertAssignedTo")
  alertsCreated    Alert[]        @relation("AlertCreatedBy")

  @@index([tenantId])
  @@map("users")
}

enum UserRole {
  ADMIN
  ONCOLOGIST
  NURSE
  MANAGER
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `email` | String | Email (único globalmente) |
| `password` | String | Hash da senha (bcrypt) |
| `name` | String | Nome completo |
| `role` | Enum | Papel: ADMIN, ONCOLOGIST, NURSE, MANAGER |
| `tenantId` | UUID | FK para tenant |
| `refreshToken` | String? | Token de refresh (rotacionado) |
| `active` | Boolean | Usuário ativo/inativo |

---

### Patient (Paciente)

Pacientes oncológicos em acompanhamento.

```prisma
model Patient {
  id               String        @id @default(uuid())
  externalId       String?       @map("external_id")
  name             String
  phone            String
  email            String?
  dateOfBirth      DateTime?     @map("date_of_birth")
  gender           String?
  address          String?
  city             String?
  state            String?
  zipCode          String?       @map("zip_code")
  cpf              String?       @unique
  healthInsurance  String?       @map("health_insurance")
  primaryDoctor    String?       @map("primary_doctor")
  cancerType       String?       @map("cancer_type")
  currentStage     String?       @map("current_stage")
  diagnosisDate    DateTime?     @map("diagnosis_date")
  priority         PatientPriority @default(MEDIUM)
  status           PatientStatus   @default(ACTIVE)
  riskScore        Float?        @map("risk_score")
  lastContactAt    DateTime?     @map("last_contact_at")
  notes            String?
  tenantId         String        @map("tenant_id")
  createdAt        DateTime      @default(now()) @map("created_at")
  updatedAt        DateTime      @updatedAt @map("updated_at")

  tenant          Tenant            @relation(fields: [tenantId], references: [id])
  messages        Message[]
  alerts          Alert[]
  conversations   Conversation[]
  journey         PatientJourney?
  priorityScores  PriorityScore[]
  internalNotes   InternalNote[]
  interventions   Intervention[]

  @@index([tenantId])
  @@index([tenantId, phone])
  @@index([tenantId, status])
  @@index([tenantId, priority])
  @@map("patients")
}

enum PatientPriority {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum PatientStatus {
  ACTIVE
  INACTIVE
  COMPLETED
  TRANSFERRED
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `externalId` | String? | ID no sistema externo (HL7/FHIR) |
| `name` | String | Nome completo |
| `phone` | String | Telefone WhatsApp (E.164) |
| `cancerType` | String? | Tipo de câncer |
| `currentStage` | String? | Estágio atual (TNM) |
| `priority` | Enum | Prioridade calculada |
| `riskScore` | Float? | Score de risco (0-100) |

---

### Message (Mensagem)

Mensagens trocadas via WhatsApp.

```prisma
model Message {
  id             String        @id @default(uuid())
  conversationId String        @map("conversation_id")
  patientId      String        @map("patient_id")
  whatsappId     String?       @unique @map("whatsapp_id")
  direction      MessageDirection
  type           MessageType   @default(TEXT)
  content        String
  mediaUrl       String?       @map("media_url")
  status         MessageStatus @default(SENT)
  sentAt         DateTime?     @map("sent_at")
  deliveredAt    DateTime?     @map("delivered_at")
  readAt         DateTime?     @map("read_at")
  isFromAgent    Boolean       @default(false) @map("is_from_agent")
  metadata       Json?
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  conversation Conversation @relation(fields: [conversationId], references: [id])
  patient      Patient      @relation(fields: [patientId], references: [id])

  @@index([conversationId])
  @@index([patientId])
  @@map("messages")
}

enum MessageDirection {
  INBOUND   // Paciente → Sistema
  OUTBOUND  // Sistema → Paciente
}

enum MessageType {
  TEXT
  IMAGE
  AUDIO
  VIDEO
  DOCUMENT
  LOCATION
  TEMPLATE
}

enum MessageStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}
```

---

### Conversation (Conversa)

Agrupa mensagens de uma sessão de chat.

```prisma
model Conversation {
  id            String             @id @default(uuid())
  patientId     String             @map("patient_id")
  status        ConversationStatus @default(OPEN)
  assignedTo    String?            @map("assigned_to")
  lastMessageAt DateTime?          @map("last_message_at")
  closedAt      DateTime?          @map("closed_at")
  metadata      Json?
  createdAt     DateTime           @default(now()) @map("created_at")
  updatedAt     DateTime           @updatedAt @map("updated_at")

  patient  Patient   @relation(fields: [patientId], references: [id])
  messages Message[]

  @@index([patientId])
  @@map("conversations")
}

enum ConversationStatus {
  OPEN
  WAITING
  CLOSED
  ESCALATED
}
```

---

### Alert (Alerta)

Notificações para equipe de enfermagem.

```prisma
model Alert {
  id          String       @id @default(uuid())
  patientId   String       @map("patient_id")
  tenantId    String       @map("tenant_id")
  type        AlertType
  severity    AlertSeverity
  title       String
  description String?
  status      AlertStatus  @default(PENDING)
  triggeredBy String?      @map("triggered_by")
  assignedToId String?     @map("assigned_to_id")
  resolvedAt  DateTime?    @map("resolved_at")
  metadata    Json?
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  patient    Patient @relation(fields: [patientId], references: [id])
  tenant     Tenant  @relation(fields: [tenantId], references: [id])
  assignedTo User?   @relation("AlertAssignedTo", fields: [assignedToId], references: [id])

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, severity])
  @@map("alerts")
}

enum AlertType {
  MISSED_APPOINTMENT     // Consulta perdida
  OVERDUE_EXAM           // Exame atrasado
  SYMPTOM_ESCALATION     // Piora de sintomas
  NO_RESPONSE            // Sem resposta do paciente
  TREATMENT_DELAY        // Atraso no tratamento
  PRIORITY_CHANGE        // Mudança de prioridade
  NAVIGATION_BLOCKED     // Navegação bloqueada
  CUSTOM                 // Personalizado
}

enum AlertSeverity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum AlertStatus {
  PENDING
  ACKNOWLEDGED
  IN_PROGRESS
  RESOLVED
  DISMISSED
}
```

---

### PatientJourney (Jornada do Paciente)

Rastreamento da jornada oncológica.

```prisma
model PatientJourney {
  id          String       @id @default(uuid())
  patientId   String       @unique @map("patient_id")
  stage       JourneyStage @default(SCREENING)
  startedAt   DateTime     @default(now()) @map("started_at")
  completedAt DateTime?    @map("completed_at")
  metadata    Json?
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")

  patient         Patient          @relation(fields: [patientId], references: [id])
  navigationSteps NavigationStep[]

  @@map("patient_journeys")
}

enum JourneyStage {
  SCREENING     // Rastreamento
  NAVIGATION    // Navegação (investigação)
  DIAGNOSIS     // Diagnóstico
  TREATMENT     // Tratamento
  FOLLOW_UP     // Seguimento
}
```

---

### NavigationStep (Etapa de Navegação)

Etapas específicas da navegação oncológica.

```prisma
model NavigationStep {
  id                String     @id @default(uuid())
  journeyId         String     @map("journey_id")
  stepType          String     @map("step_type")
  name              String
  description       String?
  status            StepStatus @default(PENDING)
  expectedDate      DateTime?  @map("expected_date")
  completedDate     DateTime?  @map("completed_date")
  daysFromDiagnosis Int?       @map("days_from_diagnosis")
  barrier           String?
  barrierDetails    String?    @map("barrier_details")
  notes             String?
  metadata          Json?
  createdAt         DateTime   @default(now()) @map("created_at")
  updatedAt         DateTime   @updatedAt @map("updated_at")

  journey PatientJourney @relation(fields: [journeyId], references: [id])

  @@index([journeyId])
  @@map("navigation_steps")
}

enum StepStatus {
  PENDING       // Pendente
  IN_PROGRESS   // Em andamento
  COMPLETED     // Concluída
  DELAYED       // Atrasada
  SKIPPED       // Pulada
  BLOCKED       // Bloqueada
}
```

---

### PriorityScore (Score de Prioridade)

Histórico de cálculos de prioridade.

```prisma
model PriorityScore {
  id         String   @id @default(uuid())
  patientId  String   @map("patient_id")
  score      Float
  category   String
  factors    Json
  modelVersion String @map("model_version")
  calculatedAt DateTime @default(now()) @map("calculated_at")

  patient Patient @relation(fields: [patientId], references: [id])

  @@index([patientId])
  @@map("priority_scores")
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `score` | Float | Score numérico (0-100) |
| `category` | String | Categoria: critical, high, medium, low |
| `factors` | JSON | Fatores que contribuíram para o score |
| `modelVersion` | String | Versão do modelo de ML |

---

### InternalNote (Nota Interna)

Notas da equipe sobre pacientes.

```prisma
model InternalNote {
  id        String   @id @default(uuid())
  patientId String   @map("patient_id")
  userId    String   @map("user_id")
  content   String
  isPinned  Boolean  @default(false) @map("is_pinned")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  patient Patient @relation(fields: [patientId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@index([patientId])
  @@map("internal_notes")
}
```

---

### Intervention (Intervenção)

Histórico de intervenções realizadas.

```prisma
model Intervention {
  id            String           @id @default(uuid())
  patientId     String           @map("patient_id")
  userId        String           @map("user_id")
  type          InterventionType
  description   String
  outcome       String?
  scheduledFor  DateTime?        @map("scheduled_for")
  completedAt   DateTime?        @map("completed_at")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  patient Patient @relation(fields: [patientId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@index([patientId])
  @@map("interventions")
}

enum InterventionType {
  PHONE_CALL        // Ligação telefônica
  WHATSAPP_MESSAGE  // Mensagem WhatsApp
  EMAIL             // Email
  HOME_VISIT        // Visita domiciliar
  APPOINTMENT       // Agendamento de consulta
  EXAM_SCHEDULING   // Agendamento de exame
  REFERRAL          // Encaminhamento
  OTHER             // Outro
}
```

---

### WhatsAppConnection (Conexão WhatsApp)

Configuração da integração WhatsApp Business.

```prisma
model WhatsAppConnection {
  id                    String   @id @default(uuid())
  tenantId              String   @map("tenant_id")
  phoneNumberId         String   @map("phone_number_id")
  wabaId                String   @map("waba_id")
  accessToken           String   @map("access_token")
  webhookVerifyToken    String?  @map("webhook_verify_token")
  businessName          String?  @map("business_name")
  phoneNumber           String?  @map("phone_number")
  isActive              Boolean  @default(true) @map("is_active")
  lastHealthCheck       DateTime? @map("last_health_check")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@unique([tenantId])
  @@map("whatsapp_connections")
}
```

---

## Índices

### Índices de Performance

```sql
-- Busca de pacientes por tenant e status
CREATE INDEX idx_patients_tenant_status 
ON patients(tenant_id, status);

-- Busca de alertas críticos
CREATE INDEX idx_alerts_tenant_severity_status 
ON alerts(tenant_id, severity, status) 
WHERE status = 'PENDING';

-- Mensagens por conversa
CREATE INDEX idx_messages_conversation 
ON messages(conversation_id, created_at DESC);

-- Navegação por jornada
CREATE INDEX idx_navigation_steps_journey 
ON navigation_steps(journey_id, status);
```

### Índices Únicos

```sql
-- Email único por tenant
CREATE UNIQUE INDEX idx_users_email 
ON users(email);

-- CPF único (quando preenchido)
CREATE UNIQUE INDEX idx_patients_cpf 
ON patients(cpf) 
WHERE cpf IS NOT NULL;

-- Uma conexão WhatsApp por tenant
CREATE UNIQUE INDEX idx_whatsapp_tenant 
ON whatsapp_connections(tenant_id);
```

---

## Migrations

### Comandos Prisma

```bash
# Criar migration
npx prisma migrate dev --name add_new_field

# Aplicar migrations (produção)
npx prisma migrate deploy

# Reset do banco (CUIDADO - apaga dados)
npx prisma migrate reset

# Gerar Prisma Client
npx prisma generate

# Visualizar banco
npx prisma studio
```

### Exemplo de Migration

```sql
-- Migration: 20240101000000_add_priority_score
ALTER TABLE patients ADD COLUMN risk_score FLOAT;
ALTER TABLE patients ADD COLUMN last_contact_at TIMESTAMP;

CREATE TABLE priority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  score FLOAT NOT NULL,
  category VARCHAR(20) NOT NULL,
  factors JSONB,
  model_version VARCHAR(50),
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_priority_scores_patient ON priority_scores(patient_id);
```

---

## Seed Data

### Dados de Teste

```typescript
// prisma/seed.ts
async function main() {
  // Tenant de demonstração
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Hospital Demo',
      slug: 'hospital-demo',
    },
  });

  // Usuários
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@oncosaas.com',
        password: await hash('admin123', 12),
        name: 'Admin',
        role: 'ADMIN',
        tenantId: tenant.id,
      },
      {
        email: 'nurse@oncosaas.com',
        password: await hash('nurse123', 12),
        name: 'Enfermeira Maria',
        role: 'NURSE',
        tenantId: tenant.id,
      },
    ],
  });

  // Pacientes de exemplo
  await prisma.patient.createMany({
    data: [
      {
        name: 'João Silva',
        phone: '+5511999999999',
        cancerType: 'Colorretal',
        priority: 'HIGH',
        tenantId: tenant.id,
      },
      // ... mais pacientes
    ],
  });
}
```

### Executar Seed

```bash
npx prisma db seed
```

---

## Boas Práticas

### 1. Sempre usar tenantId

```typescript
// ✅ Correto
const patients = await prisma.patient.findMany({
  where: { tenantId: user.tenantId }
});

// ❌ Errado - Vazamento de dados
const patients = await prisma.patient.findMany();
```

### 2. Usar transações para operações múltiplas

```typescript
await prisma.$transaction([
  prisma.patient.update({ ... }),
  prisma.alert.create({ ... }),
  prisma.intervention.create({ ... }),
]);
```

### 3. Evitar N+1 queries

```typescript
// ✅ Correto - Include
const patients = await prisma.patient.findMany({
  include: { messages: true, alerts: true }
});

// ❌ Errado - N+1
const patients = await prisma.patient.findMany();
for (const p of patients) {
  p.messages = await prisma.message.findMany({ where: { patientId: p.id }});
}
```

### 4. Paginação

```typescript
const patients = await prisma.patient.findMany({
  where: { tenantId },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

### 5. Soft Delete

```typescript
// Preferir desativar em vez de deletar
await prisma.patient.update({
  where: { id },
  data: { status: 'INACTIVE' }
});
```

---

## Backup e Recuperação

### Backup Automático (AWS RDS)

```yaml
Configurações:
  - Backup automático: Diário
  - Retenção: 30 dias
  - Point-in-Time Recovery: Habilitado
  - Snapshot manual: Antes de deploys
```

### Backup Manual

```bash
# Dump completo
pg_dump -h localhost -U postgres -d oncosaas > backup.sql

# Restaurar
psql -h localhost -U postgres -d oncosaas < backup.sql
```

---

## Monitoramento

### Queries Lentas

```sql
-- Identificar queries lentas
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### Uso de Índices

```sql
-- Verificar uso de índices
SELECT 
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan;
```

### Tamanho das Tabelas

```sql
SELECT 
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```
