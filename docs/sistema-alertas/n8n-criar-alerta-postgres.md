# Criar Alerta no PostgreSQL via n8n

## 📍 Onde Criar

**Tabela**: `alerts` (schema `public`)

**⚠️ IMPORTANTE**: Criar alerta diretamente no PostgreSQL **NÃO emite eventos WebSocket automaticamente**. Veja seção "WebSocket" abaixo.

---

## 🔧 Query SQL para Criar Alerta

### Query Básica

```sql
INSERT INTO alerts (
  id,
  "tenantId",
  "patientId",
  type,
  severity,
  message,
  context,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),                    -- UUID gerado automaticamente
  $1::uuid,                             -- tenantId (obrigatório)
  $2::uuid,                             -- patientId (obrigatório)
  $3::text::"AlertType",                -- type (ex: 'CRITICAL_SYMPTOM')
  $4::text::"AlertSeverity",            -- severity (ex: 'CRITICAL')
  $5::text,                             -- message (obrigatório)
  $6::jsonb,                            -- context (opcional, JSON)
  'PENDING'::"AlertStatus",             -- status (sempre PENDING inicialmente)
  NOW(),                                -- createdAt
  NOW()                                 -- updatedAt
) RETURNING *;
```

### Parâmetros

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `$1` | `uuid` | **tenantId** (obrigatório) | `'550e8400-e29b-41d4-a716-446655440000'` |
| `$2` | `uuid` | **patientId** (obrigatório) | `'660e8400-e29b-41d4-a716-446655440001'` |
| `$3` | `text` | **type** (enum AlertType) | `'CRITICAL_SYMPTOM'` |
| `$4` | `text` | **severity** (enum AlertSeverity) | `'CRITICAL'` |
| `$5` | `text` | **message** (obrigatório) | `'Paciente relatou febre alta (39°C)'` |
| `$6` | `jsonb` | **context** (opcional) | `'{"symptoms": ["febre"], "conversationId": "..."}'` |

---

## 📋 Valores dos Enums

### AlertType (campo `type`)

```sql
-- Valores válidos:
'CRITICAL_SYMPTOM'
'NO_RESPONSE'
'DELAYED_APPOINTMENT'
'SCORE_CHANGE'
'SYMPTOM_WORSENING'
'NAVIGATION_DELAY'
'MISSING_EXAM'
'STAGING_INCOMPLETE'
'TREATMENT_DELAY'
'FOLLOW_UP_OVERDUE'
```

### AlertSeverity (campo `severity`)

```sql
-- Valores válidos:
'CRITICAL'
'HIGH'
'MEDIUM'
'LOW'
```

### AlertStatus (campo `status`)

```sql
-- Valores válidos:
'PENDING'      -- Sempre usar ao criar
'ACKNOWLEDGED'
'RESOLVED'
'DISMISSED'
```

---

## 💻 Exemplo Completo no n8n

### Node: Postgres (Execute Query)

**Query Mode**: Execute Query

**Query**:
```sql
INSERT INTO alerts (
  id,
  "tenantId",
  "patientId",
  type,
  severity,
  message,
  context,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '{{ $json.tenantId }}'::uuid,
  '{{ $json.patientId }}'::uuid,
  'CRITICAL_SYMPTOM'::"AlertType",
  'CRITICAL'::"AlertSeverity",
  '{{ $json.message }}',
  '{{ JSON.stringify($json.context) }}'::jsonb,
  'PENDING'::"AlertStatus",
  NOW(),
  NOW()
) RETURNING 
  id,
  "tenantId",
  "patientId",
  type,
  severity,
  message,
  context,
  status,
  "createdAt";
```

**Input JSON** (do node anterior):
```json
{
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "patientId": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Paciente relatou febre alta (39°C) e calafrios",
  "context": {
    "conversationId": "770e8400-e29b-41d4-a716-446655440002",
    "messageId": "880e8400-e29b-41d4-a716-446655440003",
    "symptoms": ["febre", "calafrios"],
    "detectedBy": "n8n_agent",
    "confidence": 0.95
  }
}
```

---

## 📝 Exemplo Simplificado (Sintoma Crítico)

### Query Simplificada

```sql
INSERT INTO alerts (
  id,
  "tenantId",
  "patientId",
  type,
  severity,
  message,
  context,
  status,
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  '{{ $json.tenantId }}'::uuid,
  '{{ $json.patientId }}'::uuid,
  'CRITICAL_SYMPTOM',
  'CRITICAL',
  'Paciente relatou: {{ $json.symptoms }}',
  jsonb_build_object(
    'symptoms', '{{ JSON.stringify($json.symptoms) }}'::jsonb,
    'detectedBy', 'n8n_agent',
    'conversationId', '{{ $json.conversationId }}'
  ),
  'PENDING',
  NOW(),
  NOW()
) RETURNING *;
```

---

## ⚠️ Validações Importantes

### 1. Verificar se Paciente Existe

**Antes de criar o alerta**, validar que o paciente existe e pertence ao tenant:

```sql
-- Query de validação (executar antes do INSERT)
SELECT 
  id,
  "tenantId",
  name
FROM patients
WHERE 
  id = $1::uuid
  AND "tenantId" = $2::uuid;
```

**Se não retornar resultado**: Não criar alerta (paciente não existe ou não pertence ao tenant)

### 2. Verificar se Tenant Existe

```sql
-- Validar tenant existe
SELECT id FROM tenants WHERE id = $1::uuid;
```

---

## 🔄 WebSocket - Como Emitir Eventos

### ⚠️ Problema

**Criar alerta diretamente no PostgreSQL NÃO emite eventos WebSocket automaticamente.**

O backend NestJS só emite WebSocket quando cria alerta via `AlertsService.create()`.

### ✅ Solução: Webhook para Backend

**Após criar o alerta no PostgreSQL**, fazer uma chamada HTTP para o backend para emitir WebSocket:

#### Opção 1: Endpoint Específico para Emitir WebSocket

**Criar endpoint no backend** (se ainda não existir):

```typescript
// backend/src/alerts/alerts.controller.ts
@Post(':id/emit-websocket')
async emitWebSocket(@Param('id') id: string, @CurrentUser() user: any) {
  const alert = await this.alertsService.findOne(id, user.tenantId);
  
  // Emitir eventos WebSocket
  if (alert.severity === 'CRITICAL') {
    this.alertsGateway.emitCriticalAlert(user.tenantId, alert);
  }
  this.alertsGateway.emitNewAlert(user.tenantId, alert);
  this.alertsGateway.emitOpenAlertsCount(
    user.tenantId,
    await this.alertsService.getOpenAlertsCount(user.tenantId)
  );
  
  return { success: true };
}
```

**No n8n, após criar alerta no PostgreSQL**:

```
1. [Postgres] Criar alerta
   ↓
2. [HTTP Request] POST /api/v1/alerts/{alertId}/emit-websocket
   Headers: Authorization: Bearer {token}
```

#### Opção 2: Usar Endpoint de Atualização

**Atualizar o alerta criado** (mesmo que não mude nada) para triggerar WebSocket:

```
1. [Postgres] Criar alerta
   ↓
2. [HTTP Request] PATCH /api/v1/alerts/{alertId}
   Body: {} (vazio - não muda nada)
```

#### Opção 3: Criar via API REST (Recomendado)

**Em vez de criar direto no PostgreSQL**, usar a API REST:

```
[HTTP Request] POST /api/v1/alerts
Body: {
  "patientId": "...",
  "type": "CRITICAL_SYMPTOM",
  "severity": "CRITICAL",
  "message": "...",
  "context": {...}
}
```

**Vantagens**:
- ✅ Validação automática
- ✅ WebSocket automático
- ✅ Auditoria completa
- ✅ Menos código no n8n

---

## 🔐 Autenticação no n8n

### Para Queries SQL Diretas

**Credenciais PostgreSQL**:
- Host: `localhost` (ou IP do servidor)
- Port: `5433` (conforme docker-compose.yml)
- Database: `medsaas_development`
- User: `n8n_agent` (criar usuário específico)
- Password: `senha_segura`

**Criar usuário**:
```sql
CREATE USER n8n_agent WITH PASSWORD 'senha_segura';
GRANT CONNECT ON DATABASE medsaas_development TO n8n_agent;
GRANT USAGE ON SCHEMA public TO n8n_agent;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO n8n_agent;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n8n_agent;
```

### Para Chamadas HTTP ao Backend

**Header de Autenticação**:
```
Authorization: Bearer {JWT_TOKEN}
```

**Obter token**:
- Criar usuário sistema no backend
- Fazer login e obter token JWT
- Armazenar token como variável de ambiente no n8n

---

## 📊 Exemplo de Workflow Completo no n8n

```
1. [Webhook] Recebe mensagem WhatsApp
   ↓
2. [Function] Normalizar telefone
   ↓
3. [Postgres] Buscar paciente por telefone
   ↓
4. [Function] Processar mensagem com LLM
   ↓
5. Sintoma crítico detectado?
   ↓ SIM
6. [Postgres] Criar alerta no banco
   Query: INSERT INTO alerts (...)
   ↓
7. [HTTP Request] Emitir WebSocket
   POST /api/v1/alerts/{alertId}/emit-websocket
   ↓
8. [HTTP Request] Enviar resposta WhatsApp
```

---

## 🎯 Query SQL Completa com Validação

### Query com Validação Integrada

```sql
-- Criar alerta apenas se paciente existe e pertence ao tenant
WITH patient_check AS (
  SELECT id, "tenantId"
  FROM patients
  WHERE 
    id = $1::uuid  -- patientId
    AND "tenantId" = $2::uuid  -- tenantId
)
INSERT INTO alerts (
  id,
  "tenantId",
  "patientId",
  type,
  severity,
  message,
  context,
  status,
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  $2::uuid,  -- tenantId
  $1::uuid,  -- patientId
  $3::text::"AlertType",
  $4::text::"AlertSeverity",
  $5::text,
  $6::jsonb,
  'PENDING'::"AlertStatus",
  NOW(),
  NOW()
FROM patient_check
WHERE EXISTS (SELECT 1 FROM patient_check)
RETURNING *;
```

**Se paciente não existir**: Query retorna 0 linhas (não cria alerta)

---

## 📚 Referências

- **Schema**: `backend/prisma/schema.prisma` (model `Alert`)
- **Service**: `backend/src/alerts/alerts.service.ts`
- **Controller**: `backend/src/alerts/alerts.controller.ts`
- **Documentação n8n**: `docs/arquitetura/queries-sql-n8n.md`

---

## ⚠️ Recomendação Final

**Para produção**, recomendo:

1. **Criar alerta via API REST** (`POST /api/v1/alerts`)
   - ✅ Validação automática
   - ✅ WebSocket automático
   - ✅ Auditoria completa
   - ✅ Menos complexidade no n8n

2. **Usar SQL direto apenas se**:
   - Performance crítica (muitos alertas por segundo)
   - Não precisa de WebSocket imediato
   - Backend pode fazer polling periódico para detectar novos alertas

3. **Se usar SQL direto**:
   - Sempre validar paciente existe
   - Sempre incluir `tenantId`
   - Considerar webhook para emitir WebSocket

