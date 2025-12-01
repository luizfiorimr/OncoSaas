# 📡 Documentação da API

Documentação completa das APIs REST e WebSocket do OncoSaas.

## 🔗 Endpoints Base

- **Backend API**: `http://localhost:3002/api/v1`
- **WebSocket**: `ws://localhost:3002`
- **AI Service**: `http://localhost:8001/api/v1`

## 📋 Índice

### Autenticação
- [Login e Registro](#autenticação)
- [JWT Tokens](#jwt-tokens)
- [Refresh Tokens](#refresh-tokens)

### Pacientes
- [Listar Pacientes](#listar-pacientes)
- [Obter Paciente](#obter-paciente)
- [Criar Paciente](#criar-paciente)
- [Atualizar Paciente](#atualizar-paciente)

### Alertas
- [Listar Alertas](#listar-alertas)
- [Criar Alerta](#criar-alerta)
- [Marcar como Resolvido](#marcar-alerta-resolvido)

### Conversas
- [Listar Conversas](#listar-conversas)
- [Obter Conversa](#obter-conversa)
- [Enviar Mensagem](#enviar-mensagem)

### Navegação Oncológica
- [Obter Jornada](#obter-jornada)
- [Atualizar Etapa](#atualizar-etapa)
- [Criar Etapa](#criar-etapa)

### Priorização
- [Calcular Prioridade](#calcular-prioridade)
- [Histórico de Prioridades](#histórico-prioridades)

### WebSocket
- [Eventos em Tempo Real](#websocket)

## 🔐 Autenticação

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "NURSE",
    "tenantId": "tenant-uuid"
  }
}
```

### Registro

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name",
  "tenantId": "tenant-uuid",
  "role": "NURSE"
}
```

### JWT Tokens

Todos os endpoints protegidos requerem o header:

```http
Authorization: Bearer <access_token>
```

### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

## 👥 Pacientes

### Listar Pacientes

```http
GET /api/v1/patients
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 20)
- `search`: Busca por nome/telefone
- `status`: Filtrar por status (ACTIVE, INACTIVE, etc.)
- `priorityCategory`: Filtrar por prioridade (CRITICAL, HIGH, MEDIUM, LOW)
- `currentStage`: Filtrar por estágio da jornada
- `sortBy`: Campo para ordenação (padrão: priorityScore)
- `sortOrder`: ASC ou DESC (padrão: DESC)

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "phone": "+5511999999999",
      "currentStage": "DIAGNOSIS",
      "priorityScore": 85,
      "priorityCategory": "HIGH",
      "cancerType": "colorectal",
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Obter Paciente

```http
GET /api/v1/patients/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "cpf": "***", // Criptografado
  "birthDate": "1980-01-01T00:00:00Z",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "cancerType": "colorectal",
  "stage": "T2N1M0",
  "currentStage": "DIAGNOSIS",
  "priorityScore": 85,
  "priorityCategory": "HIGH",
  "journey": {
    "id": "uuid",
    "currentStep": "biopsy",
    "steps": [...]
  },
  "alerts": [...],
  "conversations": [...]
}
```

### Criar Paciente

```http
POST /api/v1/patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Silva",
  "cpf": "12345678900",
  "birthDate": "1980-01-01",
  "gender": "male",
  "phone": "+5511999999999",
  "email": "joao@example.com",
  "cancerType": "colorectal"
}
```

### Atualizar Paciente

```http
PATCH /api/v1/patients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "priorityScore": 90,
  "priorityCategory": "CRITICAL",
  "currentStage": "TREATMENT"
}
```

## 🚨 Alertas

### Listar Alertas

```http
GET /api/v1/alerts
Authorization: Bearer <token>
```

**Query Parameters:**
- `patientId`: Filtrar por paciente
- `severity`: Filtrar por severidade (CRITICAL, HIGH, MEDIUM, LOW)
- `status`: Filtrar por status (ACTIVE, RESOLVED, DISMISSED)
- `type`: Filtrar por tipo (DELAYED_STEP, MISSING_EXAM, etc.)

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "type": "DELAYED_STEP",
      "severity": "HIGH",
      "title": "Etapa Atrasada",
      "message": "Biópsia atrasada há 5 dias",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Criar Alerta

```http
POST /api/v1/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid",
  "type": "DELAYED_STEP",
  "severity": "HIGH",
  "title": "Etapa Atrasada",
  "message": "Biópsia atrasada há 5 dias",
  "metadata": {
    "stepId": "uuid",
    "daysDelayed": 5
  }
}
```

### Marcar Alerta como Resolvido

```http
PATCH /api/v1/alerts/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Paciente foi contatado e exame foi reagendado"
}
```

## 💬 Conversas

### Listar Conversas

```http
GET /api/v1/conversations
Authorization: Bearer <token>
```

**Query Parameters:**
- `patientId`: Filtrar por paciente
- `status`: Filtrar por status (ACTIVE, CLOSED)

### Obter Conversa

```http
GET /api/v1/conversations/:id
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "status": "ACTIVE",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Olá, tenho uma dúvida",
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Olá! Como posso ajudar?",
      "timestamp": "2024-01-01T00:00:01Z"
    }
  ]
}
```

### Enviar Mensagem

```http
POST /api/v1/conversations/:id/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Mensagem do usuário"
}
```

## 🧭 Navegação Oncológica

### Obter Jornada

```http
GET /api/v1/patients/:id/journey
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id": "uuid",
  "patientId": "uuid",
  "currentStage": "DIAGNOSIS",
  "currentStep": "biopsy",
  "steps": [
    {
      "id": "uuid",
      "name": "Biópsia",
      "type": "EXAM",
      "status": "PENDING",
      "dueDate": "2024-01-15T00:00:00Z",
      "completedAt": null
    }
  ]
}
```

### Atualizar Etapa

```http
PATCH /api/v1/journey/:journeyId/steps/:stepId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED",
  "completedAt": "2024-01-10T00:00:00Z",
  "notes": "Biópsia realizada com sucesso"
}
```

## 📊 Priorização

### Calcular Prioridade

```http
POST /api/v1/priority/calculate
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "uuid"
}
```

**Resposta:**
```json
{
  "score": 85,
  "category": "HIGH",
  "reason": "Etapa crítica atrasada há 5 dias",
  "factors": {
    "delayedSteps": 1,
    "criticalAlerts": 1,
    "timeSinceLastInteraction": 5
  }
}
```

## 🔌 WebSocket

### Conexão

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Eventos Disponíveis

#### `critical_alert`
Alerta crítico criado

```javascript
socket.on('critical_alert', (alert) => {
  console.log('Novo alerta crítico:', alert);
});
```

#### `patient_updated`
Paciente atualizado

```javascript
socket.on('patient_updated', (patient) => {
  console.log('Paciente atualizado:', patient);
});
```

#### `priority_updated`
Prioridade atualizada

```javascript
socket.on('priority_updated', (data) => {
  console.log('Prioridade atualizada:', data);
});
```

### Rooms

Os clientes são automaticamente adicionados a rooms baseados em:
- `tenant:${tenantId}` - Todos os eventos do tenant
- `patient:${patientId}` - Eventos específicos do paciente

## 🔒 Segurança

### Autenticação

- Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem JWT
- Token expira em 24h (configurável)
- Refresh token para renovação

### Multi-Tenancy

- Todos os dados são filtrados por `tenantId`
- Validação automática em todas as queries
- Erro 403 se tentar acessar dados de outro tenant

### Rate Limiting

- 100 requisições por minuto por IP
- 1000 requisições por hora por usuário

## 📝 Códigos de Status

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Bad Request (validação falhou)
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 🧪 Testando a API

### Com cURL

```bash
# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Listar pacientes (com token)
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Com Postman

1. Importar collection (quando disponível)
2. Configurar variável `base_url`
3. Fazer login e salvar token
4. Usar token em requisições subsequentes

## 📚 Recursos Adicionais

- [Swagger/OpenAPI](http://localhost:3002/api/docs) - Documentação interativa (quando disponível)
- [Postman Collection](./postman-collection.json) - Collection para importar (quando disponível)

---

**Última atualização**: 2024-01-XX
