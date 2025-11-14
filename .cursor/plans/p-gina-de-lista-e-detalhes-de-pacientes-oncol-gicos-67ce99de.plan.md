<!-- 67ce99de-28a1-4b66-b6fb-bf7c5ea3404c d77490ee-acd3-411c-8afc-57401a667a0e -->

# Complementar Dados Oncológicos

## Objetivo

Expandir o modelo `CancerDiagnosis` e formulários para incluir dados oncológicos essenciais que permitam ao oncologista tomar decisões baseadas em evidências: estadiamento TNM estruturado, biomarcadores específicos, marcadores tumorais, comorbidades e fatores de risco.

## Decisões de Arquitetura

### 1. Estadiamento TNM

- Adicionar campos estruturados: `tStage`, `nStage`, `mStage`, `grade`
- Manter campo `stage` como string (compatibilidade)
- Campo `stage` será derivado dos campos estruturados (ex: "T2N1M0 G2")

### 2. Biomarcadores

- Adicionar campos específicos no `CancerDiagnosis` para cada tipo de câncer
- Campos principais: HER2, EGFR, ALK, ROS1, BRAF, KRAS, NRAS, PD-L1, MSI-H, ER, PR, Ki-67, Gleason Score
- Valores podem ser: positivo/negativo, percentual, score numérico, ou texto livre

### 3. Escopo Completo

- Implementar todos os dados de uma vez: TNM, biomarcadores, marcadores tumorais, comorbidades, fatores de risco

## Implementação

### Fase 1: Schema do Banco de Dados

**Arquivo**: `backend/prisma/schema.prisma`

**Modificações no modelo `CancerDiagnosis`**:

1. **Estadiamento TNM Estruturado**:

- `tStage String?` - T1, T2, T3, T4, Tis, Tx
- `nStage String?` - N0, N1, N2, N3, Nx
- `mStage String?` - M0, M1, Mx
- `grade String?` - G1, G2, G3, G4, Gx (graduação histológica)
- Manter `stage String?` para compatibilidade (será calculado)

2. **Tipo Histológico**:

- `histologicalType String?` - adenocarcinoma, carcinoma escamoso, carcinoma de pequenas células, etc.

3. **Biomarcadores - Câncer de Mama**:

- `her2Status String?` - positivo, negativo, indeterminado
- `erStatus String?` - positivo, negativo (receptor de estrogênio)
- `prStatus String?` - positivo, negativo (receptor de progesterona)
- `ki67Percentage Float?` - percentual Ki-67

4. **Biomarcadores - Câncer de Pulmão/Colorretal**:

- `egfrMutation String?` - mutado, wild-type, indeterminado
- `alkRearrangement String?` - positivo, negativo
- `ros1Rearrangement String?` - positivo, negativo
- `brafMutation String?` - mutado, wild-type
- `krasMutation String?` - mutado, wild-type
- `nrasMutation String?` - mutado, wild-type
- `pdl1Expression Float?` - percentual PD-L1 (0-100)
- `msiStatus String?` - MSI-H, MSS, indeterminado

5. **Biomarcadores - Câncer de Próstata**:

- `psaBaseline Float?` - PSA inicial (ng/mL)
- `gleasonScore String?` - ex: "3+4=7", "4+3=7"

6. **Marcadores Tumorais**:

- `ceaBaseline Float?` - CEA inicial (ng/mL)
- `ca199Baseline Float?` - CA 19-9 inicial (U/mL)
- `ca125Baseline Float?` - CA 125 inicial (U/mL)
- `ca153Baseline Float?` - CA 15-3 inicial (U/mL)
- `afpBaseline Float?` - AFP inicial (ng/mL)
- `hcgBaseline Float?` - β-HCG inicial (mUI/mL)

7. **Comorbidades** (adicionar no modelo `Patient`):

- `comorbidities Json?` - array de objetos: `{ name: string, severity: string, controlled: boolean }`
- Exemplos: HAS, DM, DRC, cardiopatia, hepatopatia

8. **Fatores de Risco** (adicionar no modelo `Patient`):

- `smokingHistory String?` - nunca fumou, ex-fumante, fumante atual (anos-maço)
- `alcoholHistory String?` - nunca, ocasional, moderado, pesado (g/dia)
- `occupationalExposure String?` - exposições ocupacionais conhecidas
- `familyHistory Json?` - array de objetos: `{ relationship: string, cancerType: string, ageAtDiagnosis: number }`

### Fase 2: Migração do Banco de Dados

**Arquivo**: Nova migration em `backend/prisma/migrations/`

- Adicionar novos campos ao modelo `CancerDiagnosis`
- Adicionar campos `comorbidities`, `smokingHistory`, `alcoholHistory`, `occupationalExposure`, `familyHistory` ao modelo `Patient`
- Criar índices apropriados para campos de busca frequente

### Fase 3: DTOs e Validação (Backend)

**Arquivos**:

- `backend/src/patients/dto/create-patient.dto.ts` - Adicionar campos de comorbidades e fatores de risco
- `backend/src/patients/dto/create-cancer-diagnosis.dto.ts` - Novo DTO para criação de diagnóstico com todos os campos
- `backend/src/patients/dto/update-cancer-diagnosis.dto.ts` - DTO para atualização

**Validações**:

- Validar valores de TNM (T1-T4, N0-N3, M0-M1, G1-G4)
- Validar percentuais (0-100 para Ki-67, PD-L1)
- Validar valores numéricos de marcadores tumorais

### Fase 4: Service Layer (Backend)

**Arquivo**: `backend/src/patients/patients.service.ts`

**Métodos a adicionar/modificar**:

- `createCancerDiagnosis()` - Criar diagnóstico com todos os campos
- `updateCancerDiagnosis()` - Atualizar diagnóstico
- `calculateStageFromTNM()` - Calcular campo `stage` a partir de tStage, nStage, mStage
- Lógica para derivar `stage` automaticamente quando tStage, nStage, mStage são atualizados

### Fase 5: Controller (Backend)

**Arquivo**: `backend/src/patients/patients.controller.ts`

**Endpoints a adicionar**:

- `POST /patients/:id/cancer-diagnoses` - Criar diagnóstico de câncer
- `PATCH /patients/:id/cancer-diagnoses/:diagnosisId` - Atualizar diagnóstico
- `GET /patients/:id/cancer-diagnoses` - Listar diagnósticos do paciente

### Fase 6: Schemas de Validação Frontend

**Arquivo**: `frontend/src/lib/validations/cancer-diagnosis.ts` - Novo arquivo

**Schema Zod**:

- Validação de todos os campos de estadiamento TNM
- Validação de biomarcadores (valores permitidos por tipo)
- Validação de marcadores tumorais (valores numéricos)
- Validação de comorbidades e fatores de risco

### Fase 7: Componentes Frontend - Formulário de Diagnóstico

**Arquivo**: `frontend/src/components/patients/cancer-diagnosis-form.tsx` - Novo componente

**Estrutura**:

- Aba 1: Dados Básicos (tipo, data, ICD-10)
- Aba 2: Estadiamento TNM (T, N, M, G)
- Aba 3: Tipo Histológico e Patologia
- Aba 4: Biomarcadores (dinâmico conforme tipo de câncer)
- Aba 5: Marcadores Tumorais
- Validação condicional: mostrar apenas biomarcadores relevantes para o tipo de câncer selecionado

### Fase 8: Componentes Frontend - Visualização

**Arquivo**: `frontend/src/components/patients/patient-oncology-tab.tsx` - Modificar

**Melhorias**:

- Exibir estadiamento TNM estruturado (T, N, M, G separados)
- Exibir biomarcadores em formato tabular organizado
- Exibir marcadores tumorais com valores e datas
- Exibir comorbidades e fatores de risco
- Adicionar botão "Adicionar Diagnóstico" se múltiplos diagnósticos

### Fase 9: Formulário de Edição de Paciente

**Arquivo**: `frontend/src/components/patients/patient-edit-page.tsx` - Modificar

**Adicionar seções**:

- Seção de Comorbidades (lista + adicionar)
- Seção de Fatores de Risco (tabagismo, álcool, exposições, história familiar)

### Fase 10: Formulário de Criação de Paciente

**Arquivo**: `frontend/src/components/patients/patient-create-dialog.tsx` - Modificar

**Adicionar**:

- Campos de comorbidades e fatores de risco na etapa de dados oncológicos
- Opção de criar diagnóstico de câncer durante criação do paciente

## Considerações Técnicas

1. **Compatibilidade**: Manter campo `stage` como string para não quebrar código existente
2. **Cálculo Automático**: Quando tStage, nStage, mStage são preenchidos, calcular `stage` automaticamente (ex: "T2N1M0")
3. **Validação Condicional**: Biomarcadores mostrados apenas para tipos de câncer relevantes
4. **Performance**: Índices em campos de busca frequente (cancerType, stage, biomarkers)
5. **UI/UX**: Formulário multi-step para não sobrecarregar o usuário

## Ordem de Implementação

1. Schema e Migration (Fase 1-2)
2. DTOs e Validação Backend (Fase 3)
3. Service e Controller (Fase 4-5)
4. Schemas Frontend (Fase 6)
5. Componentes de Formulário (Fase 7, 9, 10)
6. Componentes de Visualização (Fase 8)

## Testes

- Testar criação de diagnóstico com todos os campos
- Testar cálculo automático de `stage` a partir de TNM
- Testar validação de biomarcadores por tipo de câncer
- Testar atualização de diagnóstico existente
- Testar exibição de dados na aba oncológica

### To-dos

- [x] Criar endpoint POST /api/v1/patients/import para importação CSV com validação e parsing
- [x] Criar endpoint GET /api/v1/patients/:id/detail que retorna paciente com todos os relacionamentos
- [x] Criar página /patients com lista de pacientes, filtros e tabela (implementado em /patients, não /dashboard/patients)
- [x] Criar página /patients/[id] com layout de abas (Resumo, Dados Oncológicos, Tratamento, Navegação)
- [x] Criar formulário multi-etapas para criação manual de paciente (3 etapas)
- [x] Criar dialog de importação CSV com preview e validação
- [x] Adicionar campos de estadiamento TNM estruturado (tStage, nStage, mStage, grade) ao modelo CancerDiagnosis no schema.prisma
- [x] Adicionar campos de tipo histológico e graduação ao modelo CancerDiagnosis
- [x] Adicionar campos de biomarcadores específicos (HER2, EGFR, ALK, ROS1, BRAF, KRAS, NRAS, PD-L1, MSI-H, ER, PR, Ki-67, Gleason, PSA) ao modelo CancerDiagnosis
- [x] Adicionar campos de marcadores tumorais (CEA, CA 19-9, CA 125, CA 15-3, AFP, β-HCG) ao modelo CancerDiagnosis
- [x] Adicionar campos de comorbidades e fatores de risco (smokingHistory, alcoholHistory, occupationalExposure, familyHistory, comorbidities) ao modelo Patient
- [x] Criar migration para adicionar todos os novos campos ao banco de dados
- [x] Criar DTOs para criação e atualização de CancerDiagnosis com validação de todos os novos campos
- [x] Implementar método calculateStageFromTNM() no service para calcular campo stage automaticamente
- [x] Adicionar endpoints no controller para criar/atualizar/listar diagnósticos de câncer
- [x] Criar schema Zod no frontend para validação de CancerDiagnosis com todos os campos
- [x] Criar componente CancerDiagnosisForm com abas para: dados básicos, TNM, histologia, biomarcadores, marcadores tumorais
- [x] Atualizar PatientOncologyTab para exibir estadiamento TNM estruturado, biomarcadores organizados e marcadores tumorais
- [x] Adicionar seções de comorbidades e fatores de risco no formulário de edição de paciente
- [x] Adicionar campos de comorbidades e fatores de risco no formulário de criação de paciente
