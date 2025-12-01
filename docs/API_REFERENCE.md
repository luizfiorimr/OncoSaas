# 📡 Referência da API - OncoSaas

Este documento detalha todos os endpoints da API REST do OncoSaas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Pacientes](#pacientes)
- [Conversas](#conversas)
- [Navegação Oncológica](#navegação-oncológica)
- [Alertas](#alertas)
- [Usuários](#usuários)
- [Métricas](#métricas)
- [Códigos de Status](#códigos-de-status)

## Visão Geral

**Base URL (Desenvolvimento):**
```
http://localhost:3001/api/v1
```

**Base URL (Produção):**
```
https://api.oncosaas.com/api/v1
```

**Formato de Resposta:**

```typescript
// Sucesso
{
  "data": T // Dados solicitados
}

// Erro
{
  "error": {
    "message": "Descrição do erro",
    "code": "ERROR_CODE",
    "details": {} // Opcional
  }
}
```

## Autenticação

Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem autenticação via JWT.

**Header obrigatório:**
```
Authorization: Bearer {accessToken}
```

### POST /auth/login

Autentica um usuário e retorna tokens JWT.

**Request:**
```json
{
  "email": "nurse@hospital.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "nurse@hospital.com",
      "name": "Maria Silva",
      "tenantId": "tenant-uuid",
      "roles": ["nurse"]
    }
  }
}
```

**Errors:**
- `401`: Credenciais inválidas
- `403`: Usuário inativo

### POST /auth/refresh

Renova o access token usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/logout

Invalida o refresh token atual.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (204):** No content

---

## Pacientes

### GET /patients

Lista todos os pacientes do tenant.

**Query Parameters:**
- `search` (string, opcional): Busca por nome, CPF ou prontuário
- `journeyStage` (string, opcional): Filtro por estágio (SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP)
- `cancerType` (string, opcional): Filtro por tipo de câncer
- `priorityMin` (number, opcional): Prioridade mínima (0-100)
- `priorityMax` (number, opcional): Prioridade máxima (0-100)
- `page` (number, opcional): Página (padrão: 1)
- `limit` (number, opcional): Itens por página (padrão: 20, máx: 100)
- `sortBy` (string, opcional): Campo para ordenação (priority, name, createdAt)
- `sortOrder` (string, opcional): Ordem (asc, desc)

**Response (200):**
```json
{
  "data": {
    "patients": [
      {
        "id": "uuid",
        "name": "João Silva",
        "dateOfBirth": "1960-05-15",
        "gender": "male",
        "email": "joao@email.com",
        "phone": "+5511999999999",
        "cpf": "123.456.789-00",
        "medicalRecord": "MR-001",
        "cancerType": "colorectal",
        "journeyStage": "DIAGNOSIS",
        "priorityScore": 85,
        "priorityCategory": "high",
        "createdAt": "2024-01-01T10:00:00Z",
        "updatedAt": "2024-01-10T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### GET /patients/:id

Retorna detalhes completos de um paciente.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "dateOfBirth": "1960-05-15",
    "gender": "male",
    "email": "joao@email.com",
    "phone": "+5511999999999",
    "cpf": "123.456.789-00",
    "medicalRecord": "MR-001",
    "cancerType": "colorectal",
    "journeyStage": "DIAGNOSIS",
    "priorityScore": 85,
    "priorityCategory": "high",
    "cancerDiagnoses": [
      {
        "id": "uuid",
        "diagnosisDate": "2024-01-05",
        "stage": "T3N1M0",
        "histology": "Adenocarcinoma",
        "location": "Sigmoid colon"
      }
    ],
    "navigationSteps": [
      {
        "id": "uuid",
        "stepType": "EXAM",
        "stepName": "Colonoscopia com biópsia",
        "expectedDate": "2024-01-15",
        "completionDate": null,
        "status": "pending"
      }
    ],
    "conversations": [
      {
        "id": "uuid",
        "whatsappNumber": "+5511999999999",
        "status": "active",
        "lastMessageAt": "2024-01-10T14:30:00Z"
      }
    ],
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-10T14:30:00Z"
  }
}
```

**Errors:**
- `404`: Paciente não encontrado
- `403`: Sem permissão para acessar este paciente (tenant diferente)

### POST /patients

Cria um novo paciente.

**Request:**
```json
{
  "name": "João Silva",
  "dateOfBirth": "1960-05-15",
  "gender": "male",
  "email": "joao@email.com",
  "phone": "+5511999999999",
  "cpf": "123.456.789-00",
  "medicalRecord": "MR-001",
  "cancerType": "colorectal",
  "journeyStage": "SCREENING"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "name": "João Silva",
    // ... demais campos
  }
}
```

**Validation Errors (400):**
```json
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "name": ["Nome é obrigatório"],
      "email": ["Email inválido"]
    }
  }
}
```

### PATCH /patients/:id

Atualiza parcialmente um paciente.

**Request:**
```json
{
  "priorityScore": 90,
  "journeyStage": "TREATMENT"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    // ... paciente atualizado
  }
}
```

### DELETE /patients/:id

Deleta um paciente (soft delete).

**Response (204):** No content

**Roles necessárias:** `admin`

---

## Conversas

### GET /conversations

Lista conversas do tenant.

**Query Parameters:**
- `patientId` (string, opcional): Filtrar por paciente
- `status` (string, opcional): active, archived
- `page`, `limit`: Paginação

**Response (200):**
```json
{
  "data": {
    "conversations": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "patient": {
          "name": "João Silva",
          "phone": "+5511999999999"
        },
        "whatsappNumber": "+5511999999999",
        "status": "active",
        "lastMessage": {
          "content": "Obrigado pela informação!",
          "timestamp": "2024-01-10T14:30:00Z",
          "senderType": "patient"
        },
        "unreadCount": 2,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

### GET /conversations/:id/messages

Lista mensagens de uma conversa.

**Query Parameters:**
- `page`, `limit`: Paginação
- `before` (ISO date): Mensagens antes desta data (scroll infinito)

**Response (200):**
```json
{
  "data": {
    "messages": [
      {
        "id": "uuid",
        "conversationId": "uuid",
        "senderType": "patient",
        "content": "Estou com dúvida sobre o exame",
        "timestamp": "2024-01-10T14:25:00Z",
        "status": "delivered"
      },
      {
        "id": "uuid",
        "conversationId": "uuid",
        "senderType": "agent",
        "content": "Claro! Qual é sua dúvida?",
        "timestamp": "2024-01-10T14:26:00Z",
        "status": "delivered"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

### POST /conversations/:id/messages

Envia uma mensagem (humano assumindo conversa).

**Request:**
```json
{
  "content": "Olá! Sou a enfermeira Maria. Posso ajudar?",
  "senderType": "human"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "conversationId": "uuid",
    "senderType": "human",
    "content": "Olá! Sou a enfermeira Maria. Posso ajudar?",
    "timestamp": "2024-01-10T14:30:00Z",
    "status": "sent"
  }
}
```

### PATCH /conversations/:id/status

Atualiza status da conversa.

**Request:**
```json
{
  "status": "archived" // ou "active"
}
```

**Response (200):** Conversa atualizada

---

## Navegação Oncológica

### GET /navigation/patients/:patientId/steps

Lista etapas de navegação de um paciente.

**Query Parameters:**
- `status` (string, opcional): pending, in_progress, completed, delayed

**Response (200):**
```json
{
  "data": {
    "steps": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "stepType": "EXAM",
        "stepName": "Colonoscopia com biópsia",
        "description": "Exame endoscópico para visualização...",
        "expectedDate": "2024-01-15",
        "completionDate": null,
        "status": "pending",
        "priority": "critical",
        "daysDelayed": 0,
        "createdAt": "2024-01-01T10:00:00Z"
      },
      {
        "id": "uuid",
        "patientId": "uuid",
        "stepType": "LAB",
        "stepName": "CEA basal",
        "expectedDate": "2024-01-10",
        "completionDate": null,
        "status": "delayed",
        "daysDelayed": 5
      }
    ]
  }
}
```

### POST /navigation/patients/:patientId/steps

Cria uma nova etapa de navegação.

**Request:**
```json
{
  "stepType": "CONSULTATION",
  "stepName": "Consulta com oncologista",
  "description": "Primeira consulta para definir tratamento",
  "expectedDate": "2024-01-20"
}
```

**Response (201):** Etapa criada

### PATCH /navigation/steps/:stepId

Atualiza uma etapa (marcar como concluída, adiar, etc).

**Request:**
```json
{
  "status": "completed",
  "completionDate": "2024-01-15",
  "notes": "Exame realizado com sucesso"
}
```

**Response (200):** Etapa atualizada

### GET /navigation/protocols/:cancerType

Retorna protocolo padrão de navegação para tipo de câncer.

**Response (200):**
```json
{
  "data": {
    "cancerType": "colorectal",
    "stages": [
      {
        "stage": "SCREENING",
        "steps": [
          {
            "stepType": "EXAM",
            "stepName": "PSOF (Pesquisa de Sangue Oculto)",
            "expectedDays": 30
          }
        ]
      },
      {
        "stage": "DIAGNOSIS",
        "steps": [
          {
            "stepType": "EXAM",
            "stepName": "Colonoscopia com biópsia",
            "expectedDays": 14
          }
        ]
      }
    ]
  }
}
```

---

## Alertas

### GET /alerts

Lista alertas do tenant.

**Query Parameters:**
- `patientId` (string, opcional): Filtrar por paciente
- `alertType` (string, opcional): critical, urgent, info
- `isRead` (boolean, opcional): true, false
- `page`, `limit`: Paginação

**Response (200):**
```json
{
  "data": {
    "alerts": [
      {
        "id": "uuid",
        "patientId": "uuid",
        "patient": {
          "name": "João Silva",
          "cancerType": "colorectal"
        },
        "alertType": "critical",
        "title": "Atraso crítico em colonoscopia",
        "description": "Paciente está com 10 dias de atraso na colonoscopia diagnóstica",
        "isRead": false,
        "createdAt": "2024-01-10T14:30:00Z"
      }
    ],
    "counts": {
      "critical": 5,
      "urgent": 12,
      "info": 8,
      "unread": 15
    },
    "pagination": { /* ... */ }
  }
}
```

### PATCH /alerts/:id/read

Marca alerta como lido.

**Response (200):** Alerta atualizado

### PATCH /alerts/read-all

Marca todos os alertas como lidos.

**Response (200):**
```json
{
  "data": {
    "updatedCount": 15
  }
}
```

---

## Usuários

### GET /users

Lista usuários do tenant.

**Roles necessárias:** `admin`, `manager`

**Response (200):**
```json
{
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "nurse@hospital.com",
        "name": "Maria Silva",
        "roles": ["nurse"],
        "isActive": true,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ]
  }
}
```

### POST /users

Cria novo usuário.

**Roles necessárias:** `admin`

**Request:**
```json
{
  "email": "novo@hospital.com",
  "name": "Carlos Santos",
  "password": "senha123",
  "roles": ["nurse"]
}
```

**Response (201):** Usuário criado

### PATCH /users/:id

Atualiza usuário.

**Roles necessárias:** `admin`

### DELETE /users/:id

Desativa usuário.

**Roles necessárias:** `admin`

---

## Métricas

### GET /metrics/dashboard

Retorna métricas gerais do dashboard.

**Response (200):**
```json
{
  "data": {
    "totalPatients": 150,
    "activeConversations": 23,
    "criticalAlerts": 5,
    "pendingSteps": 67,
    "averagePriority": 58.5,
    "patientsBy Stage": {
      "SCREENING": 10,
      "DIAGNOSIS": 45,
      "TREATMENT": 80,
      "FOLLOW_UP": 15
    }
  }
}
```

### GET /metrics/navigation/:cancerType

Métricas de navegação por tipo de câncer.

**Response (200):**
```json
{
  "data": {
    "cancerType": "colorectal",
    "averageTimeToTreatment": 42, // dias
    "delayedSteps": 12,
    "completionRate": 0.85,
    "bottlenecks": [
      {
        "stepName": "Colonoscopia",
        "averageDelay": 8 // dias
      }
    ]
  }
}
```

---

## Códigos de Status

### Sucesso
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado
- `204 No Content`: Sucesso sem corpo de resposta (DELETE)

### Erros do Cliente
- `400 Bad Request`: Validação falhou
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Sem permissão para acessar recurso
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já cadastrado)
- `422 Unprocessable Entity`: Dados inválidos semanticamente
- `429 Too Many Requests`: Rate limit excedido

### Erros do Servidor
- `500 Internal Server Error`: Erro não tratado
- `503 Service Unavailable`: Serviço temporariamente indisponível

---

## WebSocket (Eventos em Tempo Real)

**Conexão:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: accessToken,
    tenantId: tenantId
  }
});
```

**Namespaces:**
- `/alerts`: Alertas em tempo real
- `/conversations`: Mensagens de conversas
- `/dashboard`: Atualizações de métricas

**Eventos:**

### Namespace `/alerts`

**Eventos recebidos:**
- `critical_alert`: Novo alerta crítico
- `alert_updated`: Alerta atualizado
- `alert_read`: Alerta marcado como lido

```javascript
socket.on('critical_alert', (alert) => {
  console.log('Novo alerta crítico:', alert);
});
```

### Namespace `/conversations`

**Eventos recebidos:**
- `new_message`: Nova mensagem em conversa
- `message_status_updated`: Status da mensagem alterado

```javascript
socket.on('new_message', (message) => {
  console.log('Nova mensagem:', message);
});
```

---

## Rate Limiting

**Limites padrão:**
- Autenticação: 10 requisições/minuto
- Geral: 100 requisições/minuto
- WebSocket: 1000 eventos/minuto

**Headers de resposta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Exemplos de Uso

### Exemplo 1: Login e Busca de Pacientes

```typescript
// 1. Login
const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'nurse@hospital.com',
    password: 'senha123'
  })
});

const { data } = await loginResponse.json();
const { accessToken } = data;

// 2. Buscar pacientes com prioridade alta
const patientsResponse = await fetch(
  'http://localhost:3001/api/v1/patients?priorityMin=70&sortBy=priority&sortOrder=desc',
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  }
);

const patients = await patientsResponse.json();
console.log(patients.data.patients);
```

### Exemplo 2: Criar Paciente e Etapas

```typescript
// 1. Criar paciente
const patient = await fetch('http://localhost:3001/api/v1/patients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    name: 'João Silva',
    dateOfBirth: '1960-05-15',
    cancerType: 'colorectal',
    journeyStage: 'DIAGNOSIS'
  })
});

const { data: newPatient } = await patient.json();

// 2. Criar etapa de navegação
const step = await fetch(
  `http://localhost:3001/api/v1/navigation/patients/${newPatient.id}/steps`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      stepType: 'EXAM',
      stepName: 'Colonoscopia',
      expectedDate: '2024-01-20'
    })
  }
);
```

---

**Última atualização**: 2024-01-XX  
**Versão da API**: v1

**Precisa de ajuda?** Consulte também:
- [Arquitetura](ARCHITECTURE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
- [Desenvolvimento](desenvolvimento/setup-configuracao.md)
