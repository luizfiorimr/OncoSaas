# Resumo da Implementação - Agente de IA no n8n

## O que foi implementado

### 1. Busca de Paciente por Telefone

**Arquivos criados/modificados**:

- `backend/src/common/utils/phone.util.ts` - Funções de normalização e hash de telefone
- `backend/src/patients/patients.service.ts` - Método `findByPhone()`
- `backend/src/patients/patients.controller.ts` - Endpoint `GET /api/v1/patients/by-phone/:phone`
- `backend/prisma/schema.prisma` - Campo `phoneHash` adicionado
- `backend/prisma/migrations/20251113225730_add_phone_hash_to_patients/` - Migration criada e aplicada

**Funcionalidades**:

- Normalização de telefone para formato internacional (55XXXXXXXXXXX)
- Geração de hash SHA-256 para busca eficiente
- Busca por hash mesmo com campo `phone` criptografado
- Índice composto `(tenantId, phoneHash)` para performance

### 2. Atualização de Score de Priorização

**Arquivos criados**:

- `backend/src/patients/dto/update-priority.dto.ts` - DTO para atualização de prioridade
- `backend/src/patients/patients.service.ts` - Método `updatePriority()`
- `backend/src/patients/patients.controller.ts` - Endpoint `POST /api/v1/patients/:id/priority`

**Funcionalidades**:

- Atualiza `priorityScore`, `priorityCategory`, `priorityReason` no paciente
- Cria registro histórico em `priority_scores` automaticamente
- Transação atômica (tudo ou nada)

### 3. Módulo de Questionnaire Responses

**Arquivos criados**:

- `backend/src/questionnaire-responses/dto/create-questionnaire-response.dto.ts`
- `backend/src/questionnaire-responses/questionnaire-responses.service.ts`
- `backend/src/questionnaire-responses/questionnaire-responses.controller.ts`
- `backend/src/questionnaire-responses/questionnaire-responses.module.ts`
- `backend/src/app.module.ts` - Módulo adicionado

**Funcionalidades**:

- Endpoint `POST /api/v1/questionnaire-responses` para criar respostas
- Endpoint `GET /api/v1/questionnaire-responses` para listar (com filtros)
- Endpoint `GET /api/v1/questionnaire-responses/:id` para buscar uma resposta
- Validação de paciente e questionário existentes

### 4. Documentação de Queries SQL

**Arquivo criado**:

- `docs/arquitetura/queries-sql-n8n.md` - Guia completo de queries SQL para n8n

**Conteúdo**:

- Queries SQL prontas para uso no n8n
- Normalização de telefone em JavaScript
- Exemplos de workflow
- Endpoints REST para escrita

## Endpoints Disponíveis para o n8n

### Leitura (Queries SQL Diretas)

O n8n pode fazer queries diretas no PostgreSQL para:

- Buscar paciente por telefone
- Buscar histórico de mensagens
- Buscar dados completos do paciente
- Buscar alertas pendentes
- Buscar observações clínicas

### Escrita (Endpoints REST)

O n8n deve usar endpoints REST para criar/atualizar dados:

1. **Criar Mensagem**: `POST /api/v1/messages`
2. **Criar Observação**: `POST /api/v1/observations`
3. **Criar Alerta**: `POST /api/v1/alerts`
4. **Atualizar Prioridade**: `POST /api/v1/patients/:id/priority`
5. **Criar Resposta de Questionário**: `POST /api/v1/questionnaire-responses`
6. **Buscar Paciente por Telefone**: `GET /api/v1/patients/by-phone/:phone` (alternativa à query SQL)

## Próximos Passos Recomendados

1. **Autenticação por API Key**: Criar guard para autenticação por API Key (se não existir)
2. **Script de Migração**: Criar script para calcular `phoneHash` de pacientes existentes
3. **Testes**: Criar testes unitários e de integração para os novos endpoints
4. **Documentação Swagger**: Adicionar decorators Swagger nos novos endpoints

## Notas Importantes

- O campo `phone` continua criptografado (LGPD)
- O `phoneHash` é calculado automaticamente ao criar/atualizar pacientes
- Pacientes existentes terão `phoneHash = NULL` até serem atualizados
- Todas as queries SQL devem incluir `tenantId` para isolamento multi-tenant
- Endpoints REST fazem validação, auditoria e emitem eventos WebSocket
