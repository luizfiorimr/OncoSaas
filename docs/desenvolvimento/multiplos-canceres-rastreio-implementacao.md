# Implementação: Suporte a Múltiplos Tipos de Câncer e Rastreio

**Data:** 2024-01-XX  
**Status:** ✅ Schema e Frontend Implementados | ⏳ Migration Pendente  
**Prioridade:** 🔴 ALTA (Requisito Clínico Essencial)

---

## 📋 Resumo Executivo

Implementação completa do suporte a:

1. **Pacientes em Rastreio** (sem diagnóstico de câncer)
2. **Pacientes com Múltiplos Tipos de Câncer** (diagnósticos simultâneos)

---

## ✅ O Que Foi Implementado

### 1. **Schema Prisma - Modelo `CancerDiagnosis`**

**Localização:** `backend/prisma/schema.prisma`

**Novo Modelo:**

```prisma
model CancerDiagnosis {
  id            String    @id @default(uuid())
  tenantId      String
  patientId     String

  // Tipo de câncer
  cancerType    String    // Ex: "Câncer de Mama", "Câncer de Pulmão"
  icd10Code     String?   // Código ICD-10 (ex: "C50.9")

  // Estadiamento
  stage         String?   // TNM ou estágio
  stagingDate   DateTime?

  // Diagnóstico
  diagnosisDate DateTime
  diagnosisConfirmed Boolean @default(true)
  pathologyReport String?
  confirmedBy   String?

  // Status
  isPrimary     Boolean   @default(true)  // Diagnóstico primário?
  isActive      Boolean   @default(true)   // Ainda ativo?
  resolvedDate  DateTime?
  resolutionReason String?

  // Relacionamentos
  tenant        Tenant    @relation(...)
  patient       Patient   @relation(...)

  @@index([tenantId])
  @@index([patientId])
  @@index([isActive])
  @@index([isPrimary])
}
```

**Atualizações no Modelo `Patient`:**

- ✅ Adicionado relacionamento `cancerDiagnoses CancerDiagnosis[]`
- ✅ `cancerType` agora pode ser `null` (pacientes em rastreio)
- ✅ `stage` agora pode ser `null`

---

### 2. **Backend - PatientsService**

**Localização:** `backend/src/patients/patients.service.ts`

**Modificações:**

- ✅ `findOne()` agora inclui `journey` (rastreio, diagnóstico, tratamento)
- ✅ `findOne()` agora inclui `cancerDiagnoses` (apenas ativos, ordenados por primário e data)

**Código:**

```typescript
include: {
  journey: true,
  cancerDiagnoses: {
    where: { isActive: true },
    orderBy: [
      { isPrimary: 'desc' },
      { diagnosisDate: 'desc' },
    ],
  },
  // ...
}
```

---

### 3. **Frontend - Interface TypeScript**

**Localização:** `frontend/src/lib/api/patients.ts`

**Novas Interfaces:**

- ✅ `CancerDiagnosis` - Interface completa para diagnóstico
- ✅ `PatientJourney` - Interface para jornada do paciente
- ✅ `Patient` atualizado:
  - `cancerType: string | null` (pode ser null)
  - `journey?: PatientJourney | null`
  - `cancerDiagnoses?: CancerDiagnosis[]`

---

### 4. **Frontend - Componente PatientDetails**

**Localização:** `frontend/src/components/dashboard/patient-details.tsx`

**Funcionalidades Implementadas:**

#### ✅ **Exibição de Fase Atual**

- Mostra fase da jornada: Rastreio, Navegação, Diagnóstico, Tratamento, Seguimento
- Ícones visuais para cada fase

#### ✅ **Seção de Rastreio** (quando `currentStage === 'SCREENING'`)

- Card azul destacado com informações de rastreio
- Data do rastreio (`journey.screeningDate`)
- Resultado do rastreio (`journey.screeningResult`)
- Mensagem quando não há dados: "Aguardando início do rastreio"

#### ✅ **Múltiplos Diagnósticos**

- Lista todos os diagnósticos ativos
- Badge "Primário" para diagnóstico primário
- Card destacado (azul) para primário, cinza para secundários
- Exibe: tipo, código ICD-10, estágio, datas
- Ordenação: primário primeiro, depois por data

#### ✅ **Compatibilidade com Dados Antigos**

- Se não há `cancerDiagnoses`, usa `cancerType` (campo único)
- Mantém funcionamento com dados existentes

#### ✅ **Tratamento**

- Card verde com informações de tratamento
- Data de início, protocolo, ciclo atual/total

#### ✅ **Estados Especiais**

- Paciente em rastreio sem dados: mensagem informativa
- Paciente sem diagnóstico e não em rastreio: alerta amarelo

---

### 5. **Frontend - Chat Integration**

**Localização:** `frontend/src/app/chat/page.tsx`

**Modificações:**

- ✅ `ConversationView` agora exibe múltiplos tipos de câncer separados por vírgula
- ✅ Se houver `cancerDiagnoses`, usa o primeiro para estágio
- ✅ Fallback para "Em Rastreio" se não houver diagnóstico

---

## 🔄 Próximos Passos (Pendentes)

### ⏳ **Migration do Banco de Dados**

**Arquivo criado:** `backend/prisma/migrations/add_cancer_diagnosis/migration.sql`

**Para aplicar:**

```bash
cd backend
# Carregar .env primeiro
npx prisma migrate dev --name add_cancer_diagnosis
```

**Ou aplicar manualmente:**

```bash
psql -U postgres -d ONCONAV -f backend/prisma/migrations/add_cancer_diagnosis/migration.sql
```

---

### 📝 **Módulo Backend para CancerDiagnoses** (Opcional - Futuro)

**Criar módulo completo:**

- `backend/src/cancer-diagnoses/cancer-diagnoses.module.ts`
- `backend/src/cancer-diagnoses/cancer-diagnoses.service.ts`
- `backend/src/cancer-diagnoses/cancer-diagnoses.controller.ts`
- DTOs: `CreateCancerDiagnosisDto`, `UpdateCancerDiagnosisDto`

**Endpoints:**

- `POST /api/v1/patients/:patientId/cancer-diagnoses` - Criar diagnóstico
- `GET /api/v1/patients/:patientId/cancer-diagnoses` - Listar diagnósticos
- `PATCH /api/v1/cancer-diagnoses/:id` - Atualizar diagnóstico
- `PATCH /api/v1/cancer-diagnoses/:id/resolve` - Marcar como resolvido

---

### 🔄 **Migração de Dados Existentes** (Opcional)

**Script para migrar pacientes existentes:**

```typescript
// Para cada Patient com cancerType não-nulo:
// Criar CancerDiagnosis com isPrimary: true
```

---

## 📊 Exemplos de Uso

### **Paciente em Rastreio:**

```json
{
  "id": "patient-1",
  "name": "Maria Silva",
  "currentStage": "SCREENING",
  "cancerType": null,
  "journey": {
    "screeningDate": "2024-01-15",
    "screeningResult": "Mamografia com nódulo suspeito - aguardando biópsia"
  }
}
```

**Exibição no Frontend:**

- Fase: "🔍 Em Rastreio"
- Card azul: "Rastreio em Andamento"
- Data e resultado do rastreio

---

### **Paciente com Diagnóstico Único:**

```json
{
  "id": "patient-2",
  "name": "João Santos",
  "currentStage": "TREATMENT",
  "cancerType": "Câncer de Mama",
  "cancerDiagnoses": [
    {
      "cancerType": "Câncer de Mama",
      "stage": "T2N1M0",
      "diagnosisDate": "2024-01-10",
      "isPrimary": true,
      "isActive": true
    }
  ]
}
```

**Exibição no Frontend:**

- Fase: "💊 Tratamento"
- Card azul: "Câncer de Mama" (Primário)
- Estágio: T2N1M0

---

### **Paciente com Múltiplos Diagnósticos:**

```json
{
  "id": "patient-3",
  "name": "Ana Costa",
  "currentStage": "TREATMENT",
  "cancerType": "Câncer de Mama",
  "cancerDiagnoses": [
    {
      "cancerType": "Câncer de Mama",
      "stage": "T1N0M0",
      "diagnosisDate": "2023-06-15",
      "isPrimary": true,
      "isActive": true
    },
    {
      "cancerType": "Câncer de Pulmão",
      "stage": "T2N0M0",
      "diagnosisDate": "2024-01-20",
      "isPrimary": false,
      "isActive": true
    }
  ]
}
```

**Exibição no Frontend:**

- Fase: "💊 Tratamento"
- Card azul: "Câncer de Mama" (Primário)
- Card cinza: "Câncer de Pulmão"
- Lista ordenada: primário primeiro

---

## ✅ Checklist de Implementação

### Schema e Backend:

- [x] Criar modelo `CancerDiagnosis` no schema Prisma
- [x] Adicionar relacionamento em `Patient`
- [x] Adicionar relacionamento em `Tenant`
- [x] Atualizar `PatientsService` para incluir `journey` e `cancerDiagnoses`
- [ ] **Aplicar migration no banco de dados** ⏳
- [ ] Criar módulo `CancerDiagnosesModule` (futuro)
- [ ] Criar endpoints CRUD para diagnósticos (futuro)

### Frontend:

- [x] Criar interfaces `CancerDiagnosis` e `PatientJourney`
- [x] Atualizar interface `Patient` (cancerType nullable, journey, cancerDiagnoses)
- [x] Atualizar `PatientDetails` para exibir rastreio
- [x] Atualizar `PatientDetails` para exibir múltiplos diagnósticos
- [x] Atualizar `ConversationView` para múltiplos tipos
- [x] Tratar estados especiais (rastreio, sem diagnóstico)

### Testes:

- [ ] Testar criação de paciente em rastreio
- [ ] Testar criação de múltiplos diagnósticos
- [ ] Testar exibição no frontend
- [ ] Testar migração de dados existentes

---

## 🎯 Benefícios

1. **Suporte Realista**: Cobre cenários reais de pacientes oncológicos
2. **Rastreio Visível**: Informações de rastreio claramente exibidas
3. **Múltiplos Diagnósticos**: Suporte completo para pacientes com mais de um tipo de câncer
4. **Histórico Completo**: Rastreamento de todos os diagnósticos ao longo do tempo
5. **Compatibilidade**: Mantém funcionamento com dados antigos

---

## 📝 Notas Técnicas

- **Performance**: Índices criados em `tenantId`, `patientId`, `isActive`, `isPrimary`
- **Isolamento Multi-tenant**: Todos os diagnósticos incluem `tenantId`
- **Soft Delete**: Campo `isActive` permite desativar sem deletar (histórico)
- **Primário vs Secundário**: Campo `isPrimary` identifica diagnóstico principal

---

**Última atualização:** 2024-01-XX
