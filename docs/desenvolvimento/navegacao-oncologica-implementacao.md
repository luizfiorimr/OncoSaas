# Implementação - Sistema de Navegação Oncológica

**Data:** 2024-01-XX  
**Status:** ✅ Implementado  
**Tipo de Câncer:** Colorretal (primeiro)

---

## 📋 Resumo da Implementação

Sistema completo de painel de controle e alertas para navegação oncológica do paciente, com regras específicas para câncer colorretal em cada etapa da jornada (rastreio, diagnóstico, tratamento, seguimento).

---

## ✅ O que foi Implementado

### 1. Schema Prisma

**Novos Modelos:**
- `NavigationStep`: Etapas de navegação oncológica por paciente
- `NavigationStepStatus`: Enum de status das etapas

**Novos Tipos de Alerta:**
- `NAVIGATION_DELAY`: Atraso em etapa da navegação
- `MISSING_EXAM`: Exame necessário não realizado
- `STAGING_INCOMPLETE`: Estadiamento incompleto
- `TREATMENT_DELAY`: Atraso no início do tratamento
- `FOLLOW_UP_OVERDUE`: Seguimento atrasado

**Arquivo:** `backend/prisma/schema.prisma`

---

### 2. Backend - Módulo de Navegação Oncológica

**Estrutura:**
```
backend/src/oncology-navigation/
├── oncology-navigation.module.ts
├── oncology-navigation.service.ts
├── oncology-navigation.controller.ts
└── dto/
    ├── create-navigation-step.dto.ts
    └── update-navigation-step.dto.ts
```

**Funcionalidades:**

1. **Inicialização Automática de Etapas**
   - Método: `initializeNavigationSteps()`
   - Cria etapas baseadas no tipo de câncer e fase atual
   - Integrado ao `PatientsService` (criação/atualização de pacientes)

2. **Regras Específicas para Câncer Colorretal**
   - **RASTREIO**: PSOF, Colonoscopia
   - **DIAGNÓSTICO**: Colonoscopia com biópsia, Laudo, TC abdome/pelve/tórax, CEA basal, Testes genéticos
   - **TRATAMENTO**: Avaliação cirúrgica, Colectomia, QT adjuvante, Radioterapia
   - **SEGUIMENTO**: CEA seriado, Colonoscopia 1 ano/3 anos, TC anual

3. **Detecção de Atrasos**
   - Método: `checkOverdueSteps()`
   - Verifica etapas com `dueDate` passado
   - Marca como `OVERDUE`
   - Cria alertas automaticamente com severidade apropriada

4. **Endpoints REST:**
   - `GET /oncology-navigation/patients/:patientId/steps` - Lista todas as etapas
   - `GET /oncology-navigation/patients/:patientId/steps/:journeyStage` - Etapas por fase
   - `POST /oncology-navigation/patients/:patientId/initialize` - Inicializar etapas
   - `POST /oncology-navigation/steps` - Criar etapa manualmente
   - `PATCH /oncology-navigation/steps/:id` - Atualizar etapa
   - `POST /oncology-navigation/check-overdue` - Verificar atrasos (cron)

---

### 3. Frontend - Painel de Navegação

**Componente:** `frontend/src/components/dashboard/oncology-navigation-panel.tsx`

**Funcionalidades:**
- Exibe etapas agrupadas por fase da jornada
- Status visual (pendente, em andamento, concluída, atrasada)
- Informações de datas (esperada, prazo, conclusão)
- Botão para marcar etapa como concluída
- Indicadores de progresso (X/Y concluídas, N atrasadas)
- Destaque para fase atual do paciente

**Integração:**
- Integrado ao componente `PatientDetails`
- Aparece automaticamente quando paciente tem tipo de câncer definido

**Hooks:**
- `usePatientNavigationSteps()` - Busca etapas do paciente
- `useStepsByStage()` - Busca etapas por fase
- `useInitializeNavigationSteps()` - Inicializa etapas
- `useUpdateNavigationStep()` - Atualiza etapa

---

## 🔧 Próximos Passos Técnicos

### 1. Criar Migration do Prisma

```bash
cd backend
npx prisma migrate dev --name add_oncology_navigation
```

Isso criará:
- Tabela `navigation_steps`
- Enum `NavigationStepStatus`
- Novos valores no enum `AlertType`
- Relacionamentos e índices

### 2. Configurar Cron Job para Verificação de Atrasos

**Opção 1: Cron Job no Backend (NestJS Schedule)**

```typescript
// backend/src/oncology-navigation/oncology-navigation.service.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Cron(CronExpression.EVERY_DAY_AT_2AM)
async checkAllOverdueSteps() {
  // Buscar todos os tenants e verificar
  const tenants = await this.prisma.tenant.findMany();
  for (const tenant of tenants) {
    await this.checkOverdueSteps(tenant.id);
  }
}
```

**Opção 2: Cron Job Externo (Recomendado)**

```bash
# Executar diariamente às 2h da manhã
0 2 * * * curl -X POST http://localhost:3002/api/v1/oncology-navigation/check-overdue \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Id: $TENANT_ID"
```

### 3. Inicialização Automática

A inicialização já está integrada ao `PatientsService`:
- Quando um paciente é criado com `cancerType`, as etapas são inicializadas automaticamente
- Quando um paciente é atualizado com novo `cancerType`, as etapas são reinicializadas

**Teste:**
```bash
# Criar paciente com câncer colorretal
POST /api/v1/patients
{
  "name": "João Silva",
  "birthDate": "1970-01-01",
  "phone": "+5511999999999",
  "cancerType": "colorectal",
  "currentStage": "DIAGNOSIS"
}

# Verificar etapas criadas
GET /api/v1/oncology-navigation/patients/{patientId}/steps
```

---

## 📊 Exemplo de Uso

### Fluxo Completo

1. **Paciente Criado com Câncer Colorretal em DIAGNOSIS**
   ```typescript
   POST /api/v1/patients
   {
     "cancerType": "colorectal",
     "currentStage": "DIAGNOSIS"
   }
   ```
   → Sistema cria automaticamente:
   - Colonoscopia com Biópsia (prazo: 14 dias)
   - Laudo Anatomopatológico (prazo: 21 dias)
   - TC Abdome/Pelve (prazo: 28 dias)
   - TC Tórax (prazo: 28 dias)
   - CEA Basal (prazo: 14 dias)
   - Teste Genético (prazo: 35 dias, opcional)

2. **Após 15 dias, etapa de Colonoscopia está atrasada**
   → Sistema executa `checkOverdueSteps()`
   → Cria alerta: `NAVIGATION_DELAY` com severidade `HIGH`

3. **Médico marca etapa como concluída**
   ```typescript
   PATCH /api/v1/oncology-navigation/steps/{stepId}
   {
     "isCompleted": true,
     "status": "COMPLETED",
     "actualDate": "2024-01-15T10:00:00Z"
   }
   ```
   → Etapa marcada como concluída
   → Alerta pode ser resolvido

4. **Paciente avança para fase TREATMENT**
   → Sistema adiciona novas etapas:
   - Avaliação Cirúrgica
   - Colectomia
   - QT Adjuvante (se necessário)
   - Radioterapia (se necessário)

---

## 🎨 Interface do Usuário

### Painel de Navegação Oncológica

O painel exibe:

1. **Cabeçalho**
   - Título: "Navegação Oncológica"
   - Tipo de câncer atual

2. **Etapas por Fase** (acordeão expansível)
   - 🔍 Rastreio
   - 📋 Diagnóstico
   - 💊 Tratamento
   - 📅 Seguimento

3. **Cada Etapa Mostra:**
   - Ícone de status (✅ ⏳ ⚠️)
   - Nome e descrição
   - Badge "Obrigatória" se necessário
   - Datas (esperada, prazo, conclusão)
   - Botão "Marcar como Concluída"

4. **Indicadores:**
   - "X/Y concluídas" por fase
   - "N atrasadas" em vermelho
   - Badge "Atual" na fase atual do paciente

---

## 🔔 Sistema de Alertas

### Severidade Baseada em:

1. **Tipo de Etapa**
   - Diagnóstico/Tratamento = HIGH/CRITICAL
   - Rastreio/Seguimento = MEDIUM/LOW

2. **Dias de Atraso**
   - >14 dias = CRITICAL
   - ≤14 dias = HIGH

3. **Obrigatoriedade**
   - Obrigatória = Severidade maior
   - Opcional = Severidade menor

### Exemplo de Alerta Criado:

```json
{
  "type": "NAVIGATION_DELAY",
  "severity": "HIGH",
  "message": "Etapa atrasada: Colonoscopia com Biópsia - Colonoscopia com coleta de material para análise anatomopatológica",
  "context": {
    "stepId": "uuid",
    "stepKey": "colonoscopy_with_biopsy",
    "journeyStage": "DIAGNOSIS",
    "dueDate": "2024-01-10T00:00:00Z",
    "daysOverdue": 5
  }
}
```

---

## 📝 Checklist de Implementação

- [x] Schema Prisma atualizado
- [x] Modelo NavigationStep criado
- [x] Novos tipos de alerta adicionados
- [x] Módulo backend criado
- [x] Service com regras de câncer colorretal
- [x] Controller com endpoints REST
- [x] Integração com PatientsService
- [x] Componente frontend criado
- [x] Hooks React Query criados
- [x] Integração com PatientDetails
- [ ] **Migration do Prisma** (próximo passo)
- [ ] Cron job para verificação diária
- [ ] Testes unitários
- [ ] Testes E2E

---

## 🚀 Como Testar

### 1. Criar Migration

```bash
cd backend
npx prisma migrate dev --name add_oncology_navigation
npx prisma generate
```

### 2. Criar Paciente de Teste

```bash
POST http://localhost:3002/api/v1/patients
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Maria Santos",
  "birthDate": "1965-05-15",
  "phone": "+5511999999999",
  "email": "maria@email.com",
  "cancerType": "colorectal",
  "currentStage": "DIAGNOSIS"
}
```

### 3. Verificar Etapas Criadas

```bash
GET http://localhost:3002/api/v1/oncology-navigation/patients/{patientId}/steps
Authorization: Bearer {token}
```

### 4. Verificar no Frontend

1. Acessar dashboard
2. Selecionar paciente criado
3. Verificar se painel de navegação aparece
4. Expandir fase "Diagnóstico"
5. Verificar se etapas estão listadas

### 5. Testar Alerta de Atraso

```bash
# Simular atraso: atualizar dueDate para data passada
PATCH http://localhost:3002/api/v1/oncology-navigation/steps/{stepId}
{
  "dueDate": "2024-01-01T00:00:00Z"
}

# Verificar atrasos
POST http://localhost:3002/api/v1/oncology-navigation/check-overdue
Authorization: Bearer {token}

# Verificar se alerta foi criado
GET http://localhost:3002/api/v1/alerts?patientId={patientId}
```

---

## 📚 Referências

- **NCCN Guidelines** - Colorectal Cancer Screening
- **ASCO Guidelines** - Colorectal Cancer Treatment
- **Diretrizes Brasileiras** - Câncer Colorretal (INCA)

---

**Última atualização:** 2024-01-XX  
**Versão:** 1.0.0

