# Suporte a Múltiplos Tipos de Câncer e Rastreio

**Data:** 2024-01-XX  
**Status:** 🔄 Em Análise  
**Problema Identificado:** Schema atual não suporta múltiplos diagnósticos simultâneos

---

## 📋 Análise do Problema

### Cenários Não Cobertos Atualmente:

1. **Pacientes em Rastreio (sem diagnóstico)**
   - ✅ Schema suporta (`currentStage = SCREENING`, `cancerType = null`)
   - ❌ Frontend não exibe informações de rastreio adequadamente
   - ❌ Não mostra dados do `PatientJourney.screeningDate` e `screeningResult`

2. **Pacientes com Múltiplos Tipos de Câncer**
   - ❌ Schema não suporta (apenas `cancerType: String?`)
   - ❌ Não há histórico de diagnósticos múltiplos
   - ❌ Não há suporte para diferentes estágios por tipo de câncer

---

## 🎯 Solução Proposta

### 1. Criar Modelo `CancerDiagnosis`

**Novo modelo para suportar múltiplos diagnósticos:**

```prisma
model CancerDiagnosis {
  id            String    @id @default(uuid())
  tenantId      String
  patientId     String

  // Tipo de câncer
  cancerType    String    // Ex: "Câncer de Mama", "Câncer de Pulmão"
  icd10Code     String?   // Código ICD-10 (ex: "C50.9")

  // Estadiamento
  stage         String?   // TNM ou estágio (ex: "T2N1M0", "Estágio II")
  stagingDate   DateTime?

  // Diagnóstico
  diagnosisDate DateTime
  diagnosisConfirmed Boolean @default(true)
  pathologyReport String?   // Laudo anatomopatológico
  confirmedBy   String?     // Médico que confirmou

  // Status do diagnóstico
  isPrimary     Boolean   @default(true)  // Diagnóstico primário?
  isActive      Boolean   @default(true)   // Ainda ativo?
  resolvedDate  DateTime? // Data de resolução (se curado/removido)

  // Relacionamentos
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  patient       Patient   @relation(fields: [patientId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([tenantId])
  @@index([patientId])
  @@index([isActive])
  @@map("cancer_diagnoses")
}
```

**Atualizar modelo `Patient`:**

- Manter `cancerType` e `stage` para compatibilidade (diagnóstico primário atual)
- Adicionar relacionamento `cancerDiagnoses CancerDiagnosis[]`
- `cancerType` pode ser null para pacientes em rastreio

---

### 2. Atualizar Componente PatientDetails

**Melhorias necessárias:**

1. **Seção de Rastreio** (quando `currentStage === 'SCREENING'`):
   - Exibir data do rastreio (`journey.screeningDate`)
   - Exibir resultado do rastreio (`journey.screeningResult`)
   - Mensagem: "Paciente em rastreio - aguardando diagnóstico"

2. **Seção de Diagnósticos**:
   - Se `cancerDiagnoses.length > 0`: Listar todos os diagnósticos
   - Se apenas `cancerType`: Mostrar diagnóstico único (compatibilidade)
   - Se `cancerType === null` e `currentStage !== 'SCREENING'`: "Diagnóstico pendente"

3. **Exibir múltiplos diagnósticos**:
   - Lista de diagnósticos com:
     - Tipo de câncer
     - Estágio
     - Data do diagnóstico
     - Status (Ativo/Resolvido)
     - Indicador de diagnóstico primário

---

### 3. Atualizar Backend

**Modificações necessárias:**

1. **Criar módulo `CancerDiagnosesModule`**:
   - CRUD completo para diagnósticos
   - Endpoint para listar diagnósticos de um paciente
   - Endpoint para marcar diagnóstico como resolvido

2. **Atualizar `PatientsService`**:
   - Incluir `cancerDiagnoses` no `findOne`
   - Manter compatibilidade com `cancerType` (diagnóstico primário)

3. **Atualizar DTOs**:
   - `CreatePatientDto`: Tornar `cancerType` opcional
   - Criar `CreateCancerDiagnosisDto`
   - Criar `UpdateCancerDiagnosisDto`

---

## 📊 Estrutura de Dados Proposta

### Relacionamento:

```
Patient (1) ──< (N) CancerDiagnosis
```

### Exemplo de Dados:

**Paciente em Rastreio:**

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

**Paciente com Diagnóstico Único:**

```json
{
  "id": "patient-2",
  "name": "João Santos",
  "currentStage": "TREATMENT",
  "cancerType": "Câncer de Mama",
  "stage": "T2N1M0",
  "cancerDiagnoses": [
    {
      "id": "diag-1",
      "cancerType": "Câncer de Mama",
      "stage": "T2N1M0",
      "diagnosisDate": "2024-01-10",
      "isPrimary": true,
      "isActive": true
    }
  ]
}
```

**Paciente com Múltiplos Diagnósticos:**

```json
{
  "id": "patient-3",
  "name": "Ana Costa",
  "currentStage": "TREATMENT",
  "cancerType": "Câncer de Mama", // Diagnóstico primário
  "cancerDiagnoses": [
    {
      "id": "diag-1",
      "cancerType": "Câncer de Mama",
      "stage": "T1N0M0",
      "diagnosisDate": "2023-06-15",
      "isPrimary": true,
      "isActive": true
    },
    {
      "id": "diag-2",
      "cancerType": "Câncer de Pulmão",
      "stage": "T2N0M0",
      "diagnosisDate": "2024-01-20",
      "isPrimary": false,
      "isActive": true
    }
  ]
}
```

---

## 🔄 Migração Proposta

### Passos:

1. **Criar migration para `CancerDiagnosis`**
2. **Migrar dados existentes**:
   - Para cada `Patient` com `cancerType` não-nulo:
     - Criar `CancerDiagnosis` com `isPrimary: true`
3. **Atualizar código**:
   - Backend: Criar módulo e services
   - Frontend: Atualizar componentes
   - API: Atualizar endpoints

---

## ✅ Checklist de Implementação

### Backend:

- [ ] Criar modelo `CancerDiagnosis` no schema Prisma
- [ ] Criar migration
- [ ] Criar módulo `CancerDiagnosesModule`
- [ ] Criar DTOs (`CreateCancerDiagnosisDto`, `UpdateCancerDiagnosisDto`)
- [ ] Criar service (`CancerDiagnosesService`)
- [ ] Criar controller (`CancerDiagnosesController`)
- [ ] Atualizar `PatientsService` para incluir `cancerDiagnoses`
- [ ] Atualizar seed data com exemplos

### Frontend:

- [ ] Atualizar interface `Patient` para incluir `cancerDiagnoses`
- [ ] Atualizar `PatientDetails` para exibir rastreio
- [ ] Atualizar `PatientDetails` para exibir múltiplos diagnósticos
- [ ] Criar componente `CancerDiagnosisList`
- [ ] Criar componente `ScreeningInfo`
- [ ] Atualizar `PatientListConnected` para indicar rastreio

### Testes:

- [ ] Testar criação de paciente em rastreio
- [ ] Testar criação de múltiplos diagnósticos
- [ ] Testar exibição no frontend
- [ ] Testar migração de dados existentes

---

## 🎯 Benefícios

1. **Suporte Completo a Rastreio**: Informações de rastreio visíveis no dashboard
2. **Múltiplos Diagnósticos**: Suporte realista para pacientes com mais de um tipo de câncer
3. **Histórico Completo**: Rastreamento de todos os diagnósticos ao longo do tempo
4. **Flexibilidade**: Permite marcar diagnósticos como resolvidos sem perder histórico

---

**Última atualização:** 2024-01-XX
