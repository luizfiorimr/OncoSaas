# 🔌 Documentação da API OncoSaas

## Visão Geral

A API OncoSaas é uma API RESTful que fornece acesso a todas as funcionalidades da plataforma de navegação oncológica.

**Base URL**: `https://api.oncosaas.com/api/v1` (produção)  
**Base URL Local**: `http://localhost:3001` (desenvolvimento)

---

## Autenticação

### JWT (JSON Web Token)

Todas as rotas protegidas requerem um token JWT válido no header `Authorization`.

```http
Authorization: Bearer <seu_token_jwt>
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@hospitalteste.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clx123...",
    "email": "admin@hospitalteste.com",
    "name": "Admin",
    "role": "admin",
    "tenantId": "clx456..."
  }
}
```

### Refresh Token

```http
POST /auth/refresh
Content-Type: application/json
Authorization: Bearer <access_token>
```

### OAuth 2.0 (WhatsApp/Facebook)

Para integração WhatsApp, o fluxo OAuth é iniciado em:

```http
GET /auth/facebook
```

Callback:
```http
GET /auth/facebook/callback?code=<authorization_code>&state=<state>
```

---

## Endpoints

### Pacientes

#### Listar Pacientes

```http
GET /patients
Authorization: Bearer <token>
```

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 20, max: 100) |
| `search` | string | Busca por nome ou telefone |
| `priority` | string | Filtrar por prioridade: `critical`, `high`, `medium`, `low` |
| `journeyStage` | string | Filtrar por estágio: `SCREENING`, `DIAGNOSIS`, `TREATMENT`, `FOLLOW_UP` |
| `sortBy` | string | Campo de ordenação (default: `createdAt`) |
| `sortOrder` | string | `asc` ou `desc` (default: `desc`) |

**Resposta (200)**:
```json
{
  "data": [
    {
      "id": "clx789...",
      "name": "Maria Silva",
      "phone": "+5511999999999",
      "dateOfBirth": "1965-03-15T00:00:00.000Z",
      "gender": "female",
      "priority": "high",
      "riskScore": 75,
      "lastMessageAt": "2024-12-01T10:30:00.000Z",
      "journeyStage": "DIAGNOSIS",
      "tenantId": "clx456..."
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### Criar Paciente

```http
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Santos",
  "phone": "+5511988888888",
  "dateOfBirth": "1970-05-20",
  "gender": "male",
  "cpf": "12345678900"
}
```

**Resposta (201)**:
```json
{
  "id": "clxabc...",
  "name": "João Santos",
  "phone": "+5511988888888",
  "dateOfBirth": "1970-05-20T00:00:00.000Z",
  "gender": "male",
  "tenantId": "clx456...",
  "createdAt": "2024-12-01T15:00:00.000Z"
}
```

#### Obter Paciente

```http
GET /patients/:id
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "id": "clx789...",
  "name": "Maria Silva",
  "phone": "+5511999999999",
  "dateOfBirth": "1965-03-15T00:00:00.000Z",
  "gender": "female",
  "cpf": "98765432100",
  "priority": "high",
  "riskScore": 75,
  "journeyStage": "DIAGNOSIS",
  "journey": {
    "id": "clxjrn...",
    "currentStage": "DIAGNOSIS",
    "cancerType": "COLORECTAL",
    "steps": [...]
  },
  "messages": [...],
  "alerts": [...],
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-12-01T10:30:00.000Z"
}
```

#### Atualizar Paciente

```http
PUT /patients/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Maria Silva Santos",
  "priority": "critical"
}
```

#### Deletar Paciente

```http
DELETE /patients/:id
Authorization: Bearer <token>
```

**Resposta (204)**: No content

---

### Mensagens

#### Listar Mensagens de Paciente

```http
GET /messages/patient/:patientId
Authorization: Bearer <token>
```

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página |
| `limit` | number | Limite (default: 50) |
| `since` | ISO date | Mensagens após esta data |

**Resposta (200)**:
```json
{
  "data": [
    {
      "id": "clxmsg...",
      "content": "Olá, estou com dor abdominal",
      "direction": "INCOMING",
      "messageType": "TEXT",
      "status": "DELIVERED",
      "patientId": "clx789...",
      "createdAt": "2024-12-01T10:30:00.000Z"
    },
    {
      "id": "clxmsg2...",
      "content": "Olá Maria, entendo sua preocupação...",
      "direction": "OUTGOING",
      "messageType": "TEXT",
      "status": "READ",
      "sentBy": "AI_AGENT",
      "patientId": "clx789...",
      "createdAt": "2024-12-01T10:30:05.000Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 50
  }
}
```

#### Enviar Mensagem

```http
POST /messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "clx789...",
  "content": "Bom dia! Como você está se sentindo hoje?",
  "messageType": "TEXT"
}
```

**Resposta (201)**:
```json
{
  "id": "clxmsg3...",
  "content": "Bom dia! Como você está se sentindo hoje?",
  "direction": "OUTGOING",
  "messageType": "TEXT",
  "status": "SENT",
  "sentBy": "NURSE",
  "patientId": "clx789...",
  "createdAt": "2024-12-01T11:00:00.000Z"
}
```

---

### Alertas

#### Listar Alertas

```http
GET /alerts
Authorization: Bearer <token>
```

**Query Parameters**:
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | string | `active`, `resolved`, `all` |
| `severity` | string | `critical`, `high`, `medium`, `low` |
| `type` | string | Tipo de alerta |
| `patientId` | string | Filtrar por paciente |

**Resposta (200)**:
```json
{
  "data": [
    {
      "id": "clxalt...",
      "type": "SYMPTOM_WORSENING",
      "severity": "critical",
      "title": "Paciente relatando dor intensa",
      "description": "Maria Silva relatou dor abdominal 9/10",
      "status": "active",
      "patientId": "clx789...",
      "patient": {
        "name": "Maria Silva",
        "phone": "+5511999999999"
      },
      "createdAt": "2024-12-01T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "critical": 2,
    "high": 1,
    "medium": 1,
    "low": 1
  }
}
```

#### Resolver Alerta

```http
PATCH /alerts/:id/resolve
Authorization: Bearer <token>
Content-Type: application/json

{
  "resolution": "Paciente contactado, agendada consulta de urgência"
}
```

---

### Dashboard

#### Métricas do Dashboard

```http
GET /dashboard/metrics
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "totalPatients": 150,
  "activeConversations": 45,
  "criticalAlerts": 3,
  "pendingSteps": 28,
  "patientsInNavigation": 75,
  "averageResponseTime": 120,
  "todayMessages": 234,
  "weeklyTrend": {
    "patients": [120, 125, 130, 140, 145, 148, 150],
    "messages": [180, 195, 210, 220, 230, 225, 234]
  }
}
```

#### Pacientes com Etapas Críticas

```http
GET /dashboard/critical-steps
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "data": [
    {
      "patientId": "clx789...",
      "patientName": "Maria Silva",
      "stepType": "COLONOSCOPY",
      "stepName": "Colonoscopia com biópsia",
      "status": "OVERDUE",
      "dueDate": "2024-11-25T00:00:00.000Z",
      "daysOverdue": 6
    }
  ]
}
```

---

### Navegação Oncológica

#### Obter Jornada do Paciente

```http
GET /oncology-navigation/patient/:patientId
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "journey": {
    "id": "clxjrn...",
    "patientId": "clx789...",
    "cancerType": "COLORECTAL",
    "currentStage": "DIAGNOSIS",
    "startDate": "2024-10-01T00:00:00.000Z"
  },
  "steps": [
    {
      "id": "clxstp1...",
      "stepType": "REFERRAL_GASTRO",
      "name": "Encaminhamento para Gastroenterologista",
      "status": "COMPLETED",
      "completedAt": "2024-10-15T00:00:00.000Z"
    },
    {
      "id": "clxstp2...",
      "stepType": "COLONOSCOPY",
      "name": "Colonoscopia com biópsia",
      "status": "OVERDUE",
      "dueDate": "2024-11-25T00:00:00.000Z",
      "notes": "Aguardando agendamento SUS"
    }
  ],
  "currentStepIndex": 1,
  "progress": 33
}
```

#### Iniciar Jornada

```http
POST /oncology-navigation/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "clx789...",
  "cancerType": "COLORECTAL",
  "initialStage": "SCREENING"
}
```

#### Atualizar Etapa

```http
PATCH /oncology-navigation/steps/:stepId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "COMPLETED",
  "completedAt": "2024-12-01T00:00:00.000Z",
  "notes": "Exame realizado, aguardando resultado"
}
```

---

### Notas Internas

#### Listar Notas do Paciente

```http
GET /internal-notes/patient/:patientId
Authorization: Bearer <token>
```

#### Criar Nota

```http
POST /internal-notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "clx789...",
  "content": "Paciente relatou melhora após medicação",
  "type": "CLINICAL"
}
```

---

### Intervenções

#### Listar Intervenções do Paciente

```http
GET /interventions/patient/:patientId
Authorization: Bearer <token>
```

#### Registrar Intervenção

```http
POST /interventions
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "clx789...",
  "type": "PHONE_CALL",
  "description": "Ligação para acompanhamento pós-consulta",
  "outcome": "Paciente está bem, sem queixas novas"
}
```

---

### Usuários

#### Listar Usuários (Admin)

```http
GET /users
Authorization: Bearer <token>
```

#### Criar Usuário (Admin)

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "enfermeira@hospital.com",
  "password": "senha123",
  "name": "Ana Enfermeira",
  "role": "nurse"
}
```

---

### WhatsApp Connections

#### Status da Conexão

```http
GET /whatsapp-connections/status
Authorization: Bearer <token>
```

**Resposta (200)**:
```json
{
  "connected": true,
  "phoneNumberId": "1234567890",
  "displayPhoneNumber": "+55 11 99999-9999",
  "verifiedName": "Hospital Teste",
  "lastSync": "2024-12-01T15:00:00.000Z"
}
```

---

## WebSocket Events

### Conexão

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/alerts', {
  auth: {
    token: 'seu_jwt_token',
    tenantId: 'seu_tenant_id'
  }
});
```

### Namespaces

#### `/alerts` - Alertas em Tempo Real

**Eventos Recebidos**:
```javascript
// Novo alerta crítico
socket.on('critical_alert', (alert) => {
  console.log('Novo alerta:', alert);
  // { id, type, severity, title, patientId, patient: {...} }
});

// Alerta resolvido
socket.on('alert_resolved', (data) => {
  console.log('Alerta resolvido:', data);
  // { alertId, resolvedBy, resolution }
});
```

#### `/conversations` - Mensagens

**Eventos Recebidos**:
```javascript
// Nova mensagem
socket.on('new_message', (message) => {
  console.log('Nova mensagem:', message);
  // { id, content, direction, patientId, patient: {...} }
});

// Mensagem lida
socket.on('message_read', (data) => {
  console.log('Mensagem lida:', data);
  // { messageId, readAt }
});
```

#### `/dashboard` - Métricas

**Eventos Recebidos**:
```javascript
// Atualização de métricas
socket.on('metrics_update', (metrics) => {
  console.log('Métricas atualizadas:', metrics);
});
```

### Rooms

O servidor automaticamente adiciona clientes a rooms baseados no tenant:

```javascript
// Servidor adiciona ao room do tenant
client.join(`tenant:${tenantId}`);

// Eventos são emitidos apenas para o tenant correto
server.to(`tenant:${tenantId}`).emit('critical_alert', alert);
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token ausente ou inválido |
| 403 | Forbidden - Sem permissão para este recurso |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity - Validação falhou |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro do servidor |

**Formato de Erro**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

---

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/auth/login` | 5 req/min |
| `POST /messages` | 60 req/min |
| Outros endpoints | 120 req/min |

Headers de resposta incluem:
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1701432000
```

---

## Paginação

Todas as listas suportam paginação:

```http
GET /patients?page=2&limit=20
```

**Resposta**:
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 2,
    "limit": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": true
  }
}
```

---

## Exemplos de Uso

### cURL

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospitalteste.com","password":"senha123"}'

# Listar pacientes
curl http://localhost:3001/patients \
  -H "Authorization: Bearer <seu_token>"

# Criar paciente
curl -X POST http://localhost:3001/patients \
  -H "Authorization: Bearer <seu_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"João","phone":"+5511999999999","dateOfBirth":"1970-01-01","gender":"male"}'
```

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', data.access_token);
  return data.user;
};

// Listar pacientes
const getPatients = async () => {
  const { data } = await api.get('/patients');
  return data;
};
```

---

## Swagger/OpenAPI

A documentação interativa Swagger está disponível em desenvolvimento:

```
http://localhost:3001/api/docs
```

---

## Changelog da API

### v1.0.0 (Dezembro 2024)
- Versão inicial da API
- Endpoints de pacientes, mensagens, alertas
- Sistema de navegação oncológica
- WebSocket para atualizações em tempo real
