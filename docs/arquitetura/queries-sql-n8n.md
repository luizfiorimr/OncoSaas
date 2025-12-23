# Queries SQL para n8n - Acesso Direto ao PostgreSQL

Este documento contém as queries SQL que o agente de IA no n8n pode executar diretamente no PostgreSQL para buscar dados de pacientes e mensagens.

## Configuração de Conexão no n8n

**Credenciais PostgreSQL**:

- Host: Endereço do banco de dados
- Port: 5432 (padrão)
- Database: Nome do banco (ex: `ONCONAV_development`)
- User: Usuário com permissões (recomendado: criar usuário específico `n8n_agent`)
- Password: Senha do usuário
- SSL: Habilitado (produção)

**Criar usuário específico para n8n**:

```sql
CREATE USER n8n_agent WITH PASSWORD 'senha_segura';
GRANT CONNECT ON DATABASE ONCONAV TO n8n_agent;
GRANT USAGE ON SCHEMA public TO n8n_agent;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO n8n_agent;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO n8n_agent;
```

## Normalização de Telefone no n8n

**Function Node** para normalizar telefone antes das queries:

```javascript
// Normalizar número de telefone para formato internacional
const phone = $input.item.json.from; // ex: "11999999999" ou "+5511999999999"

// Remover caracteres não numéricos
let normalized = phone.replace(/\D/g, '');

// Se não começa com código do país, adicionar 55 (Brasil)
if (!normalized.startsWith('55')) {
  normalized = '55' + normalized;
}

// Se começa com 0, remover
if (normalized.startsWith('550')) {
  normalized = '55' + normalized.substring(2);
}

return {
  json: {
    normalizedPhone: normalized,
    originalPhone: phone,
  },
};
```

## Queries SQL

### 1. Buscar Paciente por Telefone

**Query**:

```sql
SELECT
  id,
  "tenantId",
  name,
  phone, -- descriptografar depois se necessário
  "birthDate",
  gender,
  "cancerType",
  stage,
  "currentStage",
  "priorityScore",
  "priorityCategory",
  "priorityReason",
  status,
  "lastInteraction"
FROM patients
WHERE "tenantId" = $1::uuid
  AND "phoneHash" = encode(digest($2, 'sha256'), 'hex')
LIMIT 1;
```

**Parâmetros**:

- `$1`: `tenantId` (UUID do tenant)
- `$2`: Telefone normalizado (ex: "5511999999999")

**Node n8n**: `Postgres` → Query mode → Execute Query

**Nota**: O campo `phone` está criptografado. Use `phoneHash` para busca eficiente.

### 2. Buscar Histórico de Mensagens do Paciente

**Query**:

```sql
SELECT
  id,
  "patientId",
  "conversationId",
  "whatsappMessageId",
  "whatsappTimestamp",
  type,
  direction,
  content, -- descriptografar depois
  "transcribedText",
  "structuredData",
  "criticalSymptomsDetected",
  "alertTriggered",
  "processedBy",
  "createdAt"
FROM messages
WHERE "tenantId" = $1::uuid
  AND "patientId" = $2::uuid
ORDER BY "createdAt" DESC
LIMIT 20;
```

**Parâmetros**:

- `$1`: `tenantId` (UUID)
- `$2`: `patientId` (UUID)

### 3. Buscar Dados Completos do Paciente (com JOINs)

**Query**:

```sql
SELECT
  p.id,
  p.name,
  p."birthDate",
  p.gender,
  p."cancerType",
  p.stage,
  p."currentStage",
  p."priorityScore",
  p."priorityCategory",
  p."priorityReason",
  p.status,
  -- Jornada
  pj."screeningDate",
  pj."diagnosisDate",
  pj."treatmentStartDate",
  pj."treatmentType",
  -- Diagnósticos ativos
  json_agg(
    json_build_object(
      'cancerType', cd."cancerType",
      'stage', cd.stage,
      'diagnosisDate', cd."diagnosisDate"
    )
  ) FILTER (WHERE cd."isActive" = true) as diagnoses,
  -- Últimas mensagens (apenas IDs e timestamps)
  json_agg(
    json_build_object(
      'id', m.id,
      'direction', m.direction,
      'createdAt', m."createdAt"
    )
    ORDER BY m."createdAt" DESC
  ) FILTER (WHERE m.id IS NOT NULL) as recent_messages
FROM patients p
LEFT JOIN "patient_journeys" pj ON p.id = pj."patientId"
LEFT JOIN "cancer_diagnoses" cd ON p.id = cd."patientId" AND cd."isActive" = true
LEFT JOIN messages m ON p.id = m."patientId"
WHERE p."tenantId" = $1::uuid
  AND p.id = $2::uuid
GROUP BY p.id, pj.id
LIMIT 1;
```

**Parâmetros**:

- `$1`: `tenantId` (UUID)
- `$2`: `patientId` (UUID)

### 4. Buscar Alertas Pendentes do Paciente

**Query**:

```sql
SELECT
  id,
  type,
  severity,
  message,
  context,
  status,
  "createdAt"
FROM alerts
WHERE "tenantId" = $1::uuid
  AND "patientId" = $2::uuid
  AND status != 'RESOLVED'
ORDER BY
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  "createdAt" DESC;
```

**Parâmetros**:

- `$1`: `tenantId` (UUID)
- `$2`: `patientId` (UUID)

### 5. Buscar Observações Clínicas Recentes

**Query**:

```sql
SELECT
  id,
  code,
  display,
  "valueQuantity",
  "valueString",
  unit,
  "effectiveDateTime",
  status,
  "createdAt"
FROM observations
WHERE "tenantId" = $1::uuid
  AND "patientId" = $2::uuid
ORDER BY "effectiveDateTime" DESC
LIMIT 50;
```

**Parâmetros**:

- `$1`: `tenantId` (UUID)
- `$2`: `patientId` (UUID)

## Endpoints REST para Escrita (via HTTP Request no n8n)

O n8n deve usar endpoints REST do backend NestJS para **criar/atualizar** dados (validações, auditoria, WebSocket):

### 1. Criar Mensagem

**Endpoint**: `POST /api/v1/messages`

**Headers**:

- `Authorization: Bearer {jwt_token}` ou `X-API-Key: {api_key}`
- `X-Tenant-Id: {tenantId}` (se usar API Key)

**Body**:

```json
{
  "patientId": "uuid",
  "whatsappMessageId": "wamid.xxx",
  "whatsappTimestamp": "2024-01-15T10:30:00Z",
  "type": "TEXT",
  "direction": "INBOUND",
  "content": "Texto da mensagem",
  "transcribedText": "Texto transcrito (se áudio)",
  "audioUrl": "s3://...",
  "audioDuration": 30,
  "structuredData": {},
  "criticalSymptomsDetected": [],
  "alertTriggered": false,
  "conversationId": "uuid",
  "processedBy": "AGENT"
}
```

### 2. Criar Observação Clínica

**Endpoint**: `POST /api/v1/observations`

**Body**:

```json
{
  "patientId": "uuid",
  "messageId": "uuid",
  "code": "72514-3",
  "display": "Severidade da dor",
  "valueQuantity": 8,
  "unit": "/10",
  "effectiveDateTime": "2024-01-15T10:30:00Z"
}
```

### 3. Criar Alerta

**⚠️ IMPORTANTE**: Existem duas formas de criar alertas:

#### Opção A: Via API REST (Recomendado)

**Endpoint**: `POST /api/v1/alerts`

**Body**:

```json
{
  "patientId": "uuid",
  "type": "CRITICAL_SYMPTOM",
  "severity": "CRITICAL",
  "message": "Paciente relata febre alta",
  "context": {
    "messageId": "uuid",
    "symptom": "febre",
    "temperature": 39.5
  }
}
```

**Vantagens**:

- ✅ Validação automática
- ✅ WebSocket automático
- ✅ Auditoria completa

#### Opção B: SQL Direto no PostgreSQL

**Query SQL**:

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
  $1::uuid,  -- tenantId
  $2::uuid,  -- patientId
  'CRITICAL_SYMPTOM'::"AlertType",
  'CRITICAL'::"AlertSeverity",
  $3::text,  -- message
  $4::jsonb, -- context
  'PENDING'::"AlertStatus",
  NOW(),
  NOW()
) RETURNING *;
```

**⚠️ ATENÇÃO**: Criar direto no PostgreSQL **NÃO emite WebSocket automaticamente**. Veja documentação completa em `docs/sistema-alertas/n8n-criar-alerta-postgres.md`

**Documentação completa**: [`docs/sistema-alertas/n8n-criar-alerta-postgres.md`](../../sistema-alertas/n8n-criar-alerta-postgres.md)

### 4. Atualizar Score de Priorização

**Endpoint**: `POST /api/v1/patients/:id/priority`

**Body**:

```json
{
  "score": 85,
  "category": "HIGH",
  "reason": "Dor intensa + febre",
  "modelVersion": "v1.0"
}
```

### 5. Criar Resposta de Questionário

**Endpoint**: `POST /api/v1/questionnaire-responses`

**Body**:

```json
{
  "patientId": "uuid",
  "questionnaireId": "uuid",
  "responses": {
    "eortc_qlq_c30": {
      "q1": 3,
      "q2": 2
    }
  },
  "messageId": "uuid",
  "appliedBy": "AGENT"
}
```

## Autenticação n8n → Backend

**Opções**:

1. **API Key por Tenant** (Recomendado):
   - Cada tenant tem uma API key
   - Header: `X-API-Key: {api_key}`
   - Backend valida API key e extrai tenantId

2. **JWT Service Account**:
   - Criar usuário "service" no sistema
   - n8n usa JWT do service account
   - Header: `Authorization: Bearer {jwt_token}`

**Nota**: A implementação de autenticação por API Key ainda precisa ser criada no backend se não existir.

## Exemplo de Workflow n8n

```
1. [Webhook] Recebe mensagem WhatsApp
   ↓
2. [Function] Normalizar telefone
   ↓
3. [Postgres] Buscar paciente por telefone (Query 1)
   ↓
4. Paciente encontrado?
   SIM → Continuar
   NÃO → Criar novo paciente OU retornar erro
   ↓
5. [Postgres] Buscar histórico de mensagens (Query 2)
   ↓
6. [Postgres] Buscar dados completos do paciente (Query 3)
   ↓
7. [HTTP Request] LLM (OpenAI/Anthropic) com contexto
   ↓
8. [Function] Extrair dados estruturados
   ↓
9. [HTTP Request] POST /api/v1/messages (criar mensagem)
   ↓
10. Dados estruturados extraídos?
    SIM → [HTTP Request] POST /api/v1/observations
    ↓
11. Sintoma crítico detectado?
    SIM → [HTTP Request] POST /api/v1/alerts
    ↓
12. [HTTP Request] POST /api/v1/patients/:id/priority (atualizar score)
    ↓
13. [HTTP Request] Enviar resposta via WhatsApp API
```

## Considerações Importantes

1. **Multi-tenancy**: SEMPRE incluir `tenantId` nas queries
2. **Criptografia**: Campos `phone`, `cpf`, `content` estão criptografados - usar `phoneHash` para busca
3. **Performance**: Queries com `phoneHash` são indexadas e rápidas
4. **Validação**: Endpoints REST fazem validação e auditoria - usar para escrita
5. **WebSocket**: Alertas criados via API REST emitem eventos WebSocket automaticamente
