# Estrutura do Banco de Dados PostgreSQL e Conexão

## 📋 Visão Geral

O projeto utiliza **PostgreSQL 15** como banco de dados principal, gerenciado através do **Prisma ORM**. O banco é configurado para suportar **multi-tenancy** com isolamento de dados por tenant.

---

## 🗄️ Estrutura do Banco de Dados

### Arquitetura Multi-Tenant

O banco utiliza uma abordagem **híbrida** de multi-tenancy:

1. **Schema Compartilhado**: Tabelas compartilhadas entre todos os tenants (`tenants`, `users`)
2. **Schema por Tenant**: Dados isolados por `tenantId` em todas as tabelas específicas

### Modelos Principais

#### 1. **Tenant** (Schema Compartilhado)

- Representa um hospital/clínica
- Cada tenant tem um `schemaName` único
- Configurações específicas em `settings` (JSON)

#### 2. **User** (Schema Compartilhado)

- Usuários do sistema (médicos, enfermeiros, coordenadores)
- Sempre associado a um `tenantId`
- Suporta MFA (Multi-Factor Authentication)
- Roles: `ADMIN`, `ONCOLOGIST`, `DOCTOR`, `NURSE_CHIEF`, `NURSE`, `COORDINATOR`

#### 3. **Patient** (Multi-Tenant)

- Pacientes oncológicos
- Dados sensíveis criptografados (CPF, telefone)
- Campos principais:
  - Dados básicos: nome, CPF, data nascimento, telefone, email
  - Dados oncológicos: tipo de câncer, estágio, data diagnóstico
  - Jornada: `currentStage` (SCREENING, NAVIGATION, DIAGNOSIS, TREATMENT, FOLLOW_UP)
  - Priorização IA: `priorityScore` (0-100), `priorityCategory` (CRITICAL, HIGH, MEDIUM, LOW)
  - Status: `ACTIVE`, `IN_TREATMENT`, `FOLLOW_UP`, `COMPLETED`, `DECEASED`, `INACTIVE`

#### 4. **Message** (Multi-Tenant)

- Mensagens WhatsApp
- Suporta texto, áudio, imagem, documento
- Processamento por IA ou enfermagem
- Campos criptografados: `content`, `audioUrl`, `transcribedText`

#### 5. **Alert** (Multi-Tenant)

- Alertas gerados pelo sistema
- Tipos: `CRITICAL_SYMPTOM`, `NO_RESPONSE`, `DELAYED_APPOINTMENT`, `NAVIGATION_DELAY`, etc.
- Severidade: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- Status: `PENDING`, `ACKNOWLEDGED`, `RESOLVED`, `DISMISSED`

#### 6. **PatientJourney** (Multi-Tenant)

- Jornada completa do paciente (1:1 com Patient)
- Rastreio → Diagnóstico → Tratamento → Seguimento
- Campos: datas, protocolos, ciclos, bloqueios

#### 7. **NavigationStep** (Multi-Tenant)

- Etapas de navegação oncológica (checklist)
- Status: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `CANCELLED`, `NOT_APPLICABLE`
- Suporta múltiplos tipos de câncer e etapas

#### 8. **CancerDiagnosis** (Multi-Tenant)

- Suporta múltiplos diagnósticos por paciente
- Campos: tipo de câncer, código ICD-10, estadiamento, data diagnóstico
- Status: primário, ativo, resolvido

#### 9. **Observation** (Multi-Tenant)

- Observações clínicas no padrão FHIR
- Códigos LOINC para padronização
- Sincronização com EHR externo

#### 10. **Questionnaire** e **QuestionnaireResponse** (Multi-Tenant)

- Questionários padronizados (EORTC, PRO-CTCAE, ESAS)
- Respostas estruturadas em JSON

#### 11. **WhatsAppConnection** (Multi-Tenant)

- Conexões WhatsApp Business API por tenant
- Suporta OAuth (preferencial) ou configuração manual
- Tokens criptografados

#### 12. **AuditLog** (Multi-Tenant)

- Logs de auditoria (LGPD - retenção 5 anos)
- Registra todas as ações: CREATE, UPDATE, DELETE, VIEW, EXPORT

#### 13. **InternalNote** (Multi-Tenant)

- Notas internas entre equipe
- Comunicação entre profissionais

#### 14. **Intervention** (Multi-Tenant)

- Histórico de intervenções da enfermagem
- Tipos: ASSUME, RESPONSE, ALERT_RESOLVED, NOTE_ADDED, PRIORITY_UPDATED

---

## 🔌 Configuração de Conexão

### Variáveis de Ambiente

A conexão é configurada através da variável `DATABASE_URL` no arquivo `.env`:

```env
DATABASE_URL=postgresql://ONCONAV:ONCONAV_dev@localhost:5433/ONCONAV_development
```

**Formato da URL:**

```
postgresql://[usuário]:[senha]@[host]:[porta]/[database]
```

### Configuração via Docker Compose

O PostgreSQL é executado via Docker Compose:

```yaml
postgres:
  image: postgres:15-alpine
  container_name: ONCONAV-postgres
  environment:
    POSTGRES_USER: ONCONAV
    POSTGRES_PASSWORD: ONCONAV_dev
    POSTGRES_DB: ONCONAV_development
  ports:
    - '5433:5432' # Porta externa 5433
```

**Credenciais Padrão:**

- **Host**: `localhost`
- **Porta**: `5433` (externa) / `5432` (interna do container)
- **Usuário**: `ONCONAV`
- **Senha**: `ONCONAV_dev`
- **Database**: `ONCONAV_development`

---

## 🚀 Como Conectar

### 1. Via Docker Compose (Recomendado)

**Iniciar o banco:**

```bash
docker-compose up -d postgres
```

**Verificar status:**

```bash
docker-compose ps postgres
```

**Ver logs:**

```bash
docker-compose logs -f postgres
```

**Parar o banco:**

```bash
docker-compose stop postgres
```

**Remover volumes (⚠️ apaga dados):**

```bash
docker-compose down -v
```

### 2. Via Prisma CLI

**Gerar cliente Prisma:**

```bash
cd backend
npx prisma generate
```

**Aplicar migrations:**

```bash
npx prisma migrate deploy
# ou para desenvolvimento:
npx prisma migrate dev
```

**Visualizar banco (Prisma Studio):**

```bash
npx prisma studio
```

Abre em: `http://localhost:5555`

**Resetar banco (⚠️ apaga todos os dados):**

```bash
npx prisma migrate reset
```

### 3. Via Cliente PostgreSQL (psql)

**Conectar via psql:**

```bash
psql -h localhost -p 5433 -U ONCONAV -d ONCONAV_development
```

**Ou usando URL completa:**

```bash
psql postgresql://ONCONAV:ONCONAV_dev@localhost:5433/ONCONAV_development
```

**Comandos úteis no psql:**

```sql
-- Listar todas as tabelas
\dt

-- Descrever estrutura de uma tabela
\d patients

-- Listar todos os schemas
\dn

-- Listar bancos de dados
\l

-- Sair
\q
```

### 4. Via Aplicação NestJS

O Prisma é injetado como serviço no NestJS:

```typescript
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.patient.findMany({
      where: { tenantId }, // SEMPRE incluir tenantId!
    });
  }
}
```

**Importante**: Todas as queries devem incluir `tenantId` no `where` para isolamento multi-tenant.

### 5. Via Ferramentas GUI

**DBeaver, pgAdmin, TablePlus, etc.**

**Configuração:**

- **Host**: `localhost`
- **Port**: `5433`
- **Database**: `ONCONAV_development`
- **Username**: `ONCONAV`
- **Password**: `ONCONAV_dev`

---

## 📊 Índices e Performance

### Índices Principais

O schema Prisma define índices estratégicos para performance:

**Tabela `patients`:**

- `tenantId` (isolamento multi-tenant)
- `priorityScore` (ordenação de prioridade)
- `currentStage` (filtro por etapa)
- `status` (filtro por status)
- `ehrPatientId` (integração EHR)

**Tabela `messages`:**

- `tenantId`, `patientId` (isolamento)
- `conversationId` (agrupamento)
- `whatsappTimestamp` (ordenação temporal)
- `alertTriggered` (filtro de alertas)

**Tabela `alerts`:**

- `tenantId`, `patientId` (isolamento)
- `status` (filtro por status)
- `severity, createdAt` (ordenação por severidade e data)

**Tabela `navigation_steps`:**

- `tenantId`, `patientId` (isolamento)
- `cancerType, journeyStage` (filtro por tipo e etapa)
- `status` (filtro por status)
- `dueDate` (alertas de atraso)

---

## 🔐 Segurança e LGPD

### Criptografia de Dados Sensíveis

Campos criptografados (LGPD):

- `Patient.cpf` - CPF do paciente
- `Patient.phone` - Telefone WhatsApp
- `Message.content` - Conteúdo da mensagem
- `Message.audioUrl` - URL do áudio
- `Message.transcribedText` - Texto transcrito
- `WhatsAppConnection.oauthAccessToken` - Token OAuth
- `WhatsAppConnection.oauthRefreshToken` - Refresh token
- `WhatsAppConnection.apiToken` - Token manual
- `WhatsAppConnection.appSecret` - App secret

### Auditoria

Todas as ações são registradas em `AuditLog`:

- Ação executada (CREATE, UPDATE, DELETE, VIEW, EXPORT)
- Usuário que executou
- Recurso afetado
- Valores antigos e novos
- IP e User-Agent
- Retenção: 5 anos (LGPD)

---

## 🔄 Migrations

### Estrutura de Migrations

As migrations estão em: `backend/prisma/migrations/`

**Migrations existentes:**

1. `20251112223404_init` - Schema inicial
2. `20251113014913_add_oncology_navigation` - Navegação oncológica
3. `20251113180040_add_whatsapp_connections` - Conexões WhatsApp
4. `20251113204629_add_navigation_step_fields` - Campos de navegação
5. `20251113210313_add_doctor_nurse_chief_roles` - Novos roles
6. `20251113212520_add_internal_notes_and_interventions` - Notas e intervenções
7. `20251113223706_add_fhir_integration_config` - Configuração FHIR
8. `20251113225730_add_phone_hash_to_patients` - Hash de telefone

### Criar Nova Migration

```bash
cd backend
npx prisma migrate dev --name nome_da_migration
```

### Aplicar Migrations em Produção

```bash
npx prisma migrate deploy
```

---

## 🧪 Seed (Dados Iniciais)

O arquivo `backend/prisma/seed.ts` contém dados iniciais para desenvolvimento.

**Executar seed:**

```bash
cd backend
npx prisma db seed
# ou
npm run prisma:seed
```

---

## 📝 Convenções Importantes

### Multi-Tenancy

**⚠️ REGRA CRÍTICA**: Todas as queries devem incluir `tenantId`:

```typescript
// ✅ CORRETO
const patients = await prisma.patient.findMany({
  where: { tenantId, status: 'ACTIVE' },
});

// ❌ ERRADO - Sem tenantId!
const patients = await prisma.patient.findMany({
  where: { status: 'ACTIVE' },
});
```

### Nomenclatura

- Tabelas: `snake_case` (ex: `patient_journeys`, `navigation_steps`)
- Campos: `camelCase` no Prisma, `snake_case` no banco
- Enums: `SCREAMING_SNAKE_CASE` (ex: `CRITICAL`, `HIGH`)

### Timestamps

Todas as tabelas têm:

- `createdAt` - Data de criação
- `updatedAt` - Data de atualização (auto-atualizado)

---

## 🔍 Queries Úteis

### Listar Todos os Tenants

```sql
SELECT id, name, "schemaName", "createdAt" FROM tenants;
```

### Contar Pacientes por Tenant

```sql
SELECT
  t.name as tenant_name,
  COUNT(p.id) as total_patients
FROM tenants t
LEFT JOIN patients p ON p."tenantId" = t.id
GROUP BY t.id, t.name;
```

### Pacientes com Prioridade Crítica

```sql
SELECT
  p.name,
  p."priorityScore",
  p."priorityCategory",
  p."priorityReason",
  t.name as tenant_name
FROM patients p
JOIN tenants t ON t.id = p."tenantId"
WHERE p."priorityCategory" = 'CRITICAL'
ORDER BY p."priorityScore" DESC;
```

### Alertas Pendentes por Tenant

```sql
SELECT
  t.name as tenant_name,
  COUNT(a.id) as pending_alerts
FROM tenants t
LEFT JOIN alerts a ON a."tenantId" = t.id AND a.status = 'PENDING'
GROUP BY t.id, t.name
ORDER BY pending_alerts DESC;
```

### Mensagens Não Processadas

```sql
SELECT
  COUNT(*) as unprocessed_messages
FROM messages m
WHERE m."processedBy" = 'AGENT'
  AND m."alertTriggered" = false
  AND m."createdAt" > NOW() - INTERVAL '24 hours';
```

---

## 🐛 Troubleshooting

### Erro: "Connection refused"

- Verificar se o container está rodando: `docker-compose ps`
- Verificar porta: deve ser `5433` (não `5432`)
- Verificar variável `DATABASE_URL` no `.env`

### Erro: "Database does not exist"

- Criar banco manualmente: `CREATE DATABASE ONCONAV_development;`
- Ou executar migrations: `npx prisma migrate dev`

### Erro: "Relation does not exist"

- Aplicar migrations: `npx prisma migrate deploy`
- Verificar se está conectando no banco correto

### Erro: "Permission denied"

- Verificar credenciais no `.env`
- Verificar se usuário tem permissões: `GRANT ALL PRIVILEGES ON DATABASE ONCONAV_development TO ONCONAV;`

### Resetar Banco de Dados (Desenvolvimento)

```bash
cd backend
npx prisma migrate reset
# Isso apaga todos os dados e recria o banco!
```

---

## 📚 Referências

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Schema Prisma](./backend/prisma/schema.prisma)
- [Docker Compose](./docker-compose.yml)

---

**Última atualização**: 2024-11-13
