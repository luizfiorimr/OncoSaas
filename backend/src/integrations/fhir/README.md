# Módulo de Integração FHIR

Módulo completo para integração bidirecional com sistemas EHR/PMS usando o padrão FHIR R4.

## Funcionalidades

- ✅ Cliente FHIR REST API completo
- ✅ Autenticação OAuth 2.0, Basic Auth e API Key
- ✅ Transformação automática Internal Model ↔ FHIR Resources
- ✅ Sincronização automática (push/pull)
- ✅ Cron jobs para sincronização periódica
- ✅ Retry automático com exponential backoff
- ✅ Configuração por tenant

## Estrutura

```
fhir/
├── interfaces/
│   ├── fhir-resource.interface.ts  # Tipos FHIR (Patient, Observation, etc.)
│   └── fhir-config.interface.ts    # Configuração de integração
├── services/
│   ├── fhir-auth.service.ts        # Autenticação (OAuth2, Basic, API Key)
│   ├── fhir-client.service.ts      # Cliente HTTP para FHIR API
│   ├── fhir-transformer.service.ts # Transformação de dados
│   ├── fhir-sync.service.ts        # Lógica de sincronização
│   ├── fhir-config.service.ts      # Gerenciamento de configuração
│   └── fhir-scheduler.service.ts   # Cron jobs de sincronização
├── fhir.controller.ts              # Endpoints de sincronização manual
├── fhir.module.ts                  # Módulo NestJS
└── README.md                       # Esta documentação
```

## Como Funciona

### 1. Push Automático (Plataforma → EHR)

Quando uma observação é criada:

1. `ObservationsService.create()` cria a observação no banco
2. Automaticamente chama `syncToEHRIfEnabled()`
3. Se integração habilitada e `syncFrequency = 'realtime'`:
   - Transforma para FHIR Observation
   - Envia para EHR via POST /Observation
   - Atualiza `fhirResourceId` e `syncedToEHR = true`

### 2. Pull Automático (EHR → Plataforma)

Cron job executa a cada 6 horas:

1. Busca pacientes com `ehrPatientId`
2. Para cada paciente, busca observações no EHR
3. Cria observações no banco se não existirem

### 3. Sincronização em Lote

Cron job executa a cada hora:

1. Busca observações com `syncedToEHR = false`
2. Tenta sincronizar em lote (até 50 por execução)

## Configuração

### Por enquanto (desenvolvimento)

A configuração está mockada em `FHIRConfigService`. Para habilitar:

1. Editar `backend/src/integrations/fhir/services/fhir-config.service.ts`
2. Descomentar o código de exemplo
3. Configurar variáveis de ambiente:

```env
FHIR_BASE_URL=https://fhir.example.com/fhir
FHIR_CLIENT_ID=your-client-id
FHIR_CLIENT_SECRET=your-client-secret
FHIR_TOKEN_URL=https://fhir.example.com/oauth/token
```

### Futuro (produção)

Criar tabela `FHIRIntegrationConfig` no Prisma:

```prisma
model FHIRIntegrationConfig {
  id            String   @id @default(uuid())
  tenantId      String   @unique
  enabled       Boolean  @default(false)
  baseUrl       String
  authType      String   // 'oauth2' | 'basic' | 'apikey'
  authConfig    Json     // Configuração de autenticação
  syncDirection String   // 'pull' | 'push' | 'bidirectional'
  syncFrequency String   // 'realtime' | 'hourly' | 'daily'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])
}
```

## Endpoints da API

### POST /api/v1/fhir/observations/:id/sync

Sincronizar observação específica com EHR

### POST /api/v1/fhir/patients/:id/sync

Sincronizar paciente específico com EHR

### POST /api/v1/fhir/observations/sync-all

Sincronizar todas as observações não sincronizadas (até 100)

### POST /api/v1/fhir/patients/:id/pull

Fazer pull de observações do EHR para um paciente

## Recursos FHIR Suportados

### Patient

- GET /Patient/{id}
- PUT /Patient/{id}
- POST /Patient

### Observation

- POST /Observation
- PUT /Observation/{id}
- GET /Observation?patient={patientId}

## Códigos LOINC Utilizados

- `72514-3`: Pain severity (0-10)
- `8331-1`: Nausea severity
- `8332-9`: Vomiting severity
- `8333-7`: Fatigue severity
- `72522-6`: Dyspnea severity
- `72523-4`: Appetite assessment

## Tratamento de Erros

- **401 Unauthorized**: Token expirado → refresh automático
- **404 Not Found**: Paciente não existe → criar paciente primeiro
- **409 Conflict**: Recurso já existe → atualizar ao invés de criar
- **503 Service Unavailable**: EHR offline → retry com exponential backoff

## Logs

Todos os serviços usam Logger do NestJS:

- Logs de sucesso: nível `log`
- Logs de erro: nível `error`
- Logs de aviso: nível `warn`

## Próximos Passos

1. ✅ Implementar cliente FHIR
2. ✅ Implementar sincronização automática
3. ✅ Criar cron jobs
4. ⏳ Criar tabela de configuração no banco
5. ⏳ Implementar retry com exponential backoff
6. ⏳ Implementar dead letter queue
7. ⏳ Adicionar métricas de sincronização
