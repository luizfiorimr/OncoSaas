# Resumo da Integração FHIR - Como Funciona

## ✅ O Que Foi Implementado

### 1. **Módulo Completo de Integração FHIR**
- ✅ Cliente FHIR REST API (`FHIRClientService`)
- ✅ Autenticação OAuth 2.0, Basic Auth e API Key (`FHIRAuthService`)
- ✅ Transformação de dados Internal ↔ FHIR (`FHIRTransformerService`)
- ✅ Sincronização automática push/pull (`FHIRSyncService`)
- ✅ Configuração por tenant (`FHIRConfigService`)
- ✅ Cron jobs para sincronização periódica (`FHIRSchedulerService`)

### 2. **Integração Automática**
- ✅ Push automático ao criar observação (se `syncFrequency = 'realtime'`)
- ✅ Cron job a cada hora: sincroniza observações não sincronizadas
- ✅ Cron job a cada 6 horas: pull de observações do EHR

### 3. **Endpoints de API**
- ✅ `POST /api/v1/fhir/observations/:id/sync` - Sincronizar observação
- ✅ `POST /api/v1/fhir/patients/:id/sync` - Sincronizar paciente
- ✅ `POST /api/v1/fhir/observations/sync-all` - Sincronizar todas
- ✅ `POST /api/v1/fhir/patients/:id/pull` - Pull de observações

## 🔄 Fluxo Completo

### Push Automático (Plataforma → EHR)

```
1. Agente WhatsApp coleta sintoma do paciente
   ↓
2. AI Service extrai dados estruturados
   ↓
3. ObservationsService.create() cria observação
   ↓
4. Salva no banco (syncedToEHR = false)
   ↓
5. Hook automático: syncToEHRIfEnabled()
   ↓
6. Verifica se integração habilitada
   ↓
7. Se sim e syncFrequency = 'realtime':
   ↓
8. Transforma para FHIR Observation
   ↓
9. POST /Observation para EHR
   ↓
10. Recebe fhirResourceId
   ↓
11. Atualiza: syncedToEHR = true, fhirResourceId = "123"
```

### Pull Automático (EHR → Plataforma)

```
1. Cron job executa a cada 6 horas
   ↓
2. Busca pacientes com ehrPatientId
   ↓
3. Para cada paciente:
   ↓
4. GET /Observation?patient={ehrPatientId}
   ↓
5. Recebe Bundle com observações
   ↓
6. Para cada observação:
   - Verifica se já existe (por fhirResourceId)
   - Se não existe: cria no banco
```

## 📁 Estrutura de Arquivos

```
backend/src/integrations/fhir/
├── interfaces/
│   ├── fhir-resource.interface.ts    # Tipos FHIR (Patient, Observation)
│   └── fhir-config.interface.ts      # Configuração de integração
├── services/
│   ├── fhir-auth.service.ts          # Autenticação
│   ├── fhir-client.service.ts        # Cliente HTTP REST
│   ├── fhir-transformer.service.ts   # Transformação de dados
│   ├── fhir-sync.service.ts          # Lógica de sincronização
│   ├── fhir-config.service.ts        # Configuração por tenant
│   └── fhir-scheduler.service.ts     # Cron jobs
├── fhir.controller.ts                 # Endpoints de sincronização manual
├── fhir.module.ts                     # Módulo NestJS
└── README.md                           # Documentação técnica
```

## 🔐 Autenticação

### OAuth 2.0 (Recomendado)
```typescript
{
  type: 'oauth2',
  clientId: 'xxx',
  clientSecret: 'yyy',
  tokenUrl: 'https://ehr.com/oauth/token'
}
```
- Token com refresh automático
- Cache em memória
- Retry automático se token expirar

### Basic Auth
```typescript
{
  type: 'basic',
  username: 'user',
  password: 'pass'
}
```

### API Key
```typescript
{
  type: 'apikey',
  apiKey: 'xxx',
  apiKeyHeader: 'X-API-Key'  // opcional
}
```

## 📊 Recursos FHIR Suportados

### Patient
- `GET /Patient/{id}` - Buscar paciente
- `PUT /Patient/{id}` - Atualizar paciente
- `POST /Patient` - Criar paciente

### Observation
- `POST /Observation` - Criar observação
- `PUT /Observation/{id}` - Atualizar observação
- `GET /Observation?patient={patientId}` - Buscar observações

## 🎯 Códigos LOINC Utilizados

- `72514-3`: Pain severity (0-10)
- `8331-1`: Nausea severity
- `8332-9`: Vomiting severity
- `8333-7`: Fatigue severity
- `72522-6`: Dyspnea severity
- `72523-4`: Appetite assessment

## ⚙️ Configuração Atual

**Status:** Configuração mockada (retorna `null` por padrão)

Para habilitar em desenvolvimento, editar:
`backend/src/integrations/fhir/services/fhir-config.service.ts`

```typescript
const config: FHIRIntegrationConfig = {
  tenantId,
  enabled: true,
  baseUrl: process.env.FHIR_BASE_URL,
  auth: {
    type: 'oauth2',
    clientId: process.env.FHIR_CLIENT_ID,
    clientSecret: process.env.FHIR_CLIENT_SECRET,
    tokenUrl: process.env.FHIR_TOKEN_URL,
  },
  syncDirection: 'bidirectional',
  syncFrequency: 'realtime',
};
```

## 🚀 Como Usar

### 1. Criar Observação (Push Automático)

```bash
POST /api/v1/observations
{
  "patientId": "patient-123",
  "code": "72514-3",
  "display": "Pain severity",
  "valueQuantity": 7,
  "unit": "/10",
  "effectiveDateTime": "2024-01-15T10:30:00Z"
}

# Se integração habilitada e realtime:
# → Automaticamente sincroniza com EHR
# → Retorna observação com fhirResourceId
```

### 2. Sincronização Manual

```bash
# Sincronizar observação específica
POST /api/v1/fhir/observations/{id}/sync

# Fazer pull de observações
POST /api/v1/fhir/patients/{id}/pull

# Sincronizar todas não sincronizadas
POST /api/v1/fhir/observations/sync-all
```

## 📝 Próximos Passos

1. ⏳ Criar tabela `FHIRIntegrationConfig` no Prisma
2. ⏳ Interface de configuração por tenant no frontend
3. ⏳ Implementar retry com exponential backoff mais robusto
4. ⏳ Dead letter queue para falhas persistentes
5. ⏳ Métricas e dashboard de sincronização

## 📚 Documentação Completa

- [Especificação Técnica](./arquitetura/integracao-hl7-fhir.md)
- [Explicação Detalhada](./integracao-fhir-explicacao.md)
- [README do Módulo](../backend/src/integrations/fhir/README.md)

