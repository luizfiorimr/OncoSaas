# Sistema de Navegação Oncológica - Câncer Colorretal

**Data:** 2024-01-XX  
**Status:** ✅ Implementado  
**Prioridade:** 🔴 ALTA (Navegação Clínica)

---

## 📋 Resumo

Sistema de painel de controle e alertas para navegação oncológica do paciente em cada etapa da jornada (rastreio, diagnóstico, tratamento, seguimento), com regras específicas para câncer colorretal.

---

## 🎯 Objetivo

Garantir que pacientes com câncer colorretal sigam o fluxo clínico adequado em cada etapa, com alertas automáticos para atrasos e etapas pendentes, melhorando a qualidade do cuidado e reduzindo tempo de espera.

---

## 🏗️ Arquitetura

### Backend

**Módulo:** `backend/src/oncology-navigation/`

- **Service:** `oncology-navigation.service.ts`
  - Gerencia etapas de navegação
  - Detecta etapas atrasadas
  - Cria alertas automaticamente
  - Regras específicas por tipo de câncer

- **Controller:** `oncology-navigation.controller.ts`
  - Endpoints REST para gerenciar etapas

- **DTOs:**
  - `create-navigation-step.dto.ts`
  - `update-navigation-step.dto.ts`

### Frontend

**Componente:** `frontend/src/components/dashboard/oncology-navigation-panel.tsx`

- Painel visual com etapas por fase da jornada
- Status visual (pendente, em andamento, concluída, atrasada)
- Marcação manual de etapas como concluídas
- Alertas visuais para etapas atrasadas

---

## 📊 Modelo de Dados

### NavigationStep (Prisma)

```prisma
model NavigationStep {
  id              String    @id @default(uuid())
  tenantId        String
  patientId       String
  journeyId       String?
  
  // Contexto
  cancerType      String    // "colorectal", "breast", etc.
  journeyStage    JourneyStage // SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP
  stepKey         String    // "colonoscopy", "biopsy", etc.
  stepName        String    // "Colonoscopia"
  stepDescription String?
  
  // Status
  status          NavigationStepStatus
  isRequired      Boolean
  isCompleted     Boolean
  completedAt     DateTime?
  completedBy     String?
  
  // Datas
  expectedDate    DateTime?
  dueDate         DateTime?
  actualDate      DateTime?
  
  // Metadados
  metadata        Json?
  notes           String?
}
```

### Novos Tipos de Alerta

```prisma
enum AlertType {
  // ... tipos existentes
  NAVIGATION_DELAY    // Atraso em etapa da navegação oncológica
  MISSING_EXAM        // Exame necessário não realizado
  STAGING_INCOMPLETE  // Estadiamento incompleto
  TREATMENT_DELAY     // Atraso no início do tratamento
  FOLLOW_UP_OVERDUE   // Seguimento atrasado
}
```

---

## 🎯 Regras para Câncer Colorretal

### RASTREIO (SCREENING)

**Etapas Obrigatórias:**

1. **Pesquisa de Sangue Oculto nas Fezes (PSOF)**
   - Prazo: 30 dias
   - Descrição: Exame de rastreio inicial
   - Severidade de alerta: MEDIUM

2. **Colonoscopia** (se PSOF positivo ou sintomas)
   - Prazo: 60 dias
   - Descrição: Exame de rastreio ou diagnóstico
   - Severidade: MEDIUM
   - Obrigatória: Não (depende do resultado do PSOF)

---

### DIAGNÓSTICO (DIAGNOSIS)

**Etapas Obrigatórias:**

1. **Colonoscopia com Biópsia**
   - Prazo: 14 dias (urgente)
   - Descrição: Colonoscopia com coleta de material para análise anatomopatológica
   - Severidade: HIGH

2. **Laudo Anatomopatológico**
   - Prazo: 21 dias após biópsia
   - Descrição: Resultado da biópsia confirmando diagnóstico e tipo histológico
   - Severidade: HIGH

3. **TC de Abdome e Pelve**
   - Prazo: 28 dias após diagnóstico
   - Descrição: Tomografia para estadiamento (avaliar metástases)
   - Severidade: HIGH

4. **TC de Tórax**
   - Prazo: 28 dias após diagnóstico
   - Descrição: Avaliar metástases pulmonares
   - Severidade: HIGH

5. **CEA Basal**
   - Prazo: 14 dias
   - Descrição: Dosagem de CEA como marcador tumoral basal
   - Severidade: MEDIUM

**Etapas Opcionais:**

6. **Teste Genético (MSI, KRAS, NRAS, BRAF)**
   - Prazo: 35 dias
   - Descrição: Testes moleculares para orientar tratamento (especialmente se estágio avançado)
   - Severidade: MEDIUM
   - Obrigatória: Não (depende do estadiamento)

---

### TRATAMENTO (TREATMENT)

**Etapas Obrigatórias:**

1. **Avaliação Cirúrgica**
   - Prazo: 14 dias
   - Descrição: Consulta com cirurgião para planejamento da ressecção
   - Severidade: HIGH

2. **Colectomia (Cirurgia)**
   - Prazo: 42 dias (6 semanas após diagnóstico)
   - Descrição: Ressecção cirúrgica do tumor
   - Severidade: CRITICAL (se atrasar >14 dias)

**Etapas Condicionais:**

3. **Quimioterapia Adjuvante**
   - Prazo: 90 dias (4-8 semanas pós-cirurgia)
   - Descrição: QT adjuvante (FOLFOX ou CAPOX) se estágio III ou alto risco estágio II
   - Severidade: HIGH
   - Obrigatória: Não (depende do estadiamento pós-cirúrgico)

4. **Radioterapia**
   - Prazo: 60 dias
   - Descrição: RT neoadjuvante ou adjuvante para câncer retal (T3-T4 ou N+)
   - Severidade: HIGH
   - Obrigatória: Não (apenas para reto)

---

### SEGUIMENTO (FOLLOW_UP)

**Etapas Obrigatórias:**

1. **CEA aos 3 meses**
   - Prazo: 90 dias após tratamento
   - Descrição: Primeira dosagem de CEA pós-tratamento
   - Severidade: MEDIUM

2. **Colonoscopia de Controle (1 ano)**
   - Prazo: 365 dias após cirurgia
   - Descrição: Primeira colonoscopia de seguimento
   - Severidade: MEDIUM

3. **TC Abdome/Pelve Anual**
   - Prazo: 365 dias (anual por 3-5 anos)
   - Descrição: TC anual para rastreio de recidiva
   - Severidade: MEDIUM

4. **Colonoscopia de Controle (3 anos)**
   - Prazo: 1095 dias (3 anos)
   - Descrição: Segunda colonoscopia de seguimento
   - Severidade: MEDIUM

---

## 🔔 Sistema de Alertas

### Detecção Automática

O sistema verifica automaticamente etapas atrasadas através do método `checkOverdueSteps()`:

1. Busca etapas com `status = PENDING` ou `IN_PROGRESS`
2. Verifica se `dueDate < hoje` e `isCompleted = false`
3. Marca como `OVERDUE`
4. Cria alerta automaticamente com severidade baseada em:
   - Tipo de etapa (diagnóstico/tratamento = HIGH/CRITICAL)
   - Dias de atraso (>14 dias = CRITICAL)
   - Se é obrigatória ou não

### Severidade dos Alertas

- **CRITICAL**: Etapas de diagnóstico/tratamento obrigatórias com >14 dias de atraso
- **HIGH**: Etapas de diagnóstico/tratamento obrigatórias com ≤14 dias de atraso
- **MEDIUM**: Etapas de rastreio/seguimento obrigatórias ou etapas opcionais importantes
- **LOW**: Etapas opcionais

---

## 🚀 Como Usar

### Inicializar Etapas para um Paciente

```typescript
// Via API
POST /api/v1/oncology-navigation/patients/:patientId/initialize
Body: {
  cancerType: "colorectal",
  currentStage: "DIAGNOSIS"
}
```

### Obter Etapas de um Paciente

```typescript
GET /api/v1/oncology-navigation/patients/:patientId/steps
```

### Obter Etapas por Fase

```typescript
GET /api/v1/oncology-navigation/patients/:patientId/steps/:journeyStage
```

### Marcar Etapa como Concluída

```typescript
PATCH /api/v1/oncology-navigation/steps/:id
Body: {
  isCompleted: true,
  status: "COMPLETED",
  completedAt: "2024-01-15T10:00:00Z",
  actualDate: "2024-01-15T10:00:00Z"
}
```

### Verificar Etapas Atrasadas (Cron Job)

```typescript
POST /api/v1/oncology-navigation/check-overdue
```

**Recomendação:** Executar diariamente via cron job.

---

## 📱 Interface do Usuário

### Painel de Navegação Oncológica

O painel exibe:

1. **Etapas Agrupadas por Fase da Jornada**
   - SCREENING (Rastreio)
   - DIAGNOSIS (Diagnóstico)
   - TREATMENT (Tratamento)
   - FOLLOW_UP (Seguimento)

2. **Status Visual**
   - ✅ Concluída (verde)
   - ⏳ Em Andamento (azul)
   - ⚠️ Atrasada (vermelho)
   - ⏸️ Pendente (amarelo/cinza)

3. **Informações por Etapa**
   - Nome e descrição
   - Data esperada e prazo
   - Data de conclusão (se aplicável)
   - Badge "Obrigatória" se necessário
   - Botão para marcar como concluída

4. **Indicadores**
   - Contador de etapas concluídas por fase
   - Contador de etapas atrasadas
   - Destaque para fase atual do paciente

---

## 🔄 Fluxo de Trabalho

### Quando um Paciente é Criado

1. Sistema detecta tipo de câncer e fase atual
2. Chama `initializeNavigationSteps()` automaticamente
3. Cria todas as etapas relevantes para aquela fase
4. Define datas esperadas e prazos baseados em guidelines

### Quando um Paciente Muda de Fase

1. Sistema detecta mudança de `currentStage`
2. Adiciona novas etapas da nova fase
3. Mantém etapas pendentes da fase anterior
4. Atualiza `nextStep` no `PatientJourney`

### Verificação Diária (Cron)

1. Executa `checkOverdueSteps()` para todos os tenants
2. Marca etapas atrasadas como `OVERDUE`
3. Cria alertas automaticamente
4. Notifica equipe via WebSocket

---

## 📚 Referências Clínicas

### Guidelines Utilizadas

- **NCCN Guidelines** - Colorectal Cancer Screening
- **ASCO Guidelines** - Colorectal Cancer Treatment
- **Diretrizes Brasileiras** - Câncer Colorretal (INCA)

### Prazos Baseados em Evidências

- **Diagnóstico**: <30 dias (padrão ouro: <14 dias para biópsia)
- **Cirurgia**: <6 semanas após diagnóstico (padrão ouro: <4 semanas)
- **QT Adjuvante**: Iniciar 4-8 semanas pós-cirurgia
- **Seguimento**: CEA a cada 3 meses, TC anual por 3-5 anos

---

## 🔮 Próximos Passos

1. ✅ **Câncer Colorretal** - Implementado
2. ⏳ **Câncer de Mama** - Próximo
3. ⏳ **Câncer de Pulmão** - Próximo
4. ⏳ **Câncer de Próstata** - Próximo
5. ⏳ **Cânceres Urológicos** (Rim, Bexiga, Testículo) - Próximo

---

## 🧪 Testes

### Teste Manual

1. Criar paciente com câncer colorretal em fase DIAGNOSIS
2. Verificar se etapas foram criadas automaticamente
3. Aguardar prazo de uma etapa passar
4. Executar `checkOverdueSteps()`
5. Verificar se alerta foi criado
6. Marcar etapa como concluída
7. Verificar se alerta foi resolvido

---

## 📝 Notas Técnicas

- **Performance**: Índices criados em `cancerType + journeyStage` e `dueDate`
- **Escalabilidade**: Verificação de atrasos pode ser executada em background
- **Extensibilidade**: Fácil adicionar novos tipos de câncer através do método `getNavigationStepsForCancerType()`

---

**Última atualização:** 2024-01-XX  
**Versão:** 1.0.0

