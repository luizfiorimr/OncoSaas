# Dashboard da Nurse - Navegação Oncológica
## Análise com Equipe de Navegação Oncológica

**Data:** 2024-01-XX  
**Status:** 📋 Proposta  
**Prioridade:** 🔴 ALTA

---

## 🎯 Objetivo

Criar um dashboard específico para enfermeiros de navegação oncológica que permita acompanhar pacientes através das etapas da jornada oncológica, identificar atrasos e priorizar ações.

---

## 👥 Jobs-to-be-Done do Enfermeiro de Navegação Oncológica

### Job Principal
**"Como enfermeiro de navegação oncológica, eu preciso acompanhar pacientes através das etapas da jornada (rastreio → diagnóstico → tratamento → seguimento) para garantir que nenhuma etapa crítica seja perdida ou atrasada."**

### Jobs Secundários

1. **Identificar Pacientes que Precisam de Ação Imediata**
   - Ver pacientes com etapas atrasadas (OVERDUE)
   - Ver pacientes com alertas de navegação (NAVIGATION_DELAY, MISSING_EXAM, TREATMENT_DELAY)
   - Priorizar por severidade e urgência

2. **Acompanhar Progresso da Navegação**
   - Ver pacientes por fase da jornada (SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP)
   - Ver progresso de etapas por paciente (% concluídas)
   - Identificar pacientes "travados" em uma fase

3. **Gerenciar Etapas Críticas**
   - Ver etapas obrigatórias pendentes
   - Ver etapas próximas do prazo (próximas 7 dias)
   - Marcar etapas como concluídas quando necessário

4. **Comunicar com Equipe**
   - Adicionar notas internas sobre progresso do paciente
   - Registrar intervenções realizadas
   - Ver histórico de ações da equipe

---

## 📊 Métricas Essenciais para Navegação Oncológica

### Métricas Operacionais (Já Implementadas)
- ✅ Alertas resolvidos hoje
- ✅ Tempo médio de resposta
- ✅ Pacientes atendidos hoje

### Métricas de Navegação Oncológica (Novas)

1. **Etapas Atrasadas**
   - Total de etapas com status OVERDUE
   - Etapas críticas atrasadas (obrigatórias + >14 dias)
   - Pacientes com etapas atrasadas

2. **Distribuição por Fase da Jornada**
   - Pacientes em SCREENING
   - Pacientes em DIAGNOSIS
   - Pacientes em TREATMENT
   - Pacientes em FOLLOW_UP

3. **Progresso de Etapas**
   - Taxa de conclusão de etapas (% concluídas/total)
   - Tempo médio de conclusão por fase
   - Etapas próximas do prazo (próximas 7 dias)

4. **Alertas de Navegação**
   - NAVIGATION_DELAY (atraso em etapa)
   - MISSING_EXAM (exame necessário não realizado)
   - STAGING_INCOMPLETE (estadiamento incompleto)
   - TREATMENT_DELAY (atraso no início do tratamento)
   - FOLLOW_UP_OVERDUE (seguimento atrasado)

---

## 🎨 Componentes do Dashboard

### 1. Métricas no Topo (Compactas)
- Alertas resolvidos hoje
- Tempo médio de resposta
- Pacientes atendidos hoje
- **NOVO:** Etapas atrasadas (total)
- **NOVO:** Pacientes por fase da jornada (4 cards: SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP)

### 2. Lista de Pacientes com Etapas Críticas
**Priorização:**
1. Etapas OVERDUE obrigatórias (>14 dias)
2. Etapas OVERDUE obrigatórias (≤14 dias)
3. Etapas obrigatórias próximas do prazo (próximas 7 dias)
4. Pacientes com alertas de navegação (NAVIGATION_DELAY, MISSING_EXAM, TREATMENT_DELAY)

**Informações por Paciente:**
- Nome e idade
- Tipo de câncer
- Fase atual da jornada (badge colorido)
- Etapa crítica pendente/atrasada
- Dias de atraso (se aplicável)
- Progresso de etapas (% concluídas)
- Badge de prioridade (CRITICAL, HIGH, MEDIUM, LOW)

**Ações:**
- Clicar no paciente → Ver detalhes da navegação
- Botão "Ver Navegação" → Abrir painel de etapas

### 3. Painel de Navegação Oncológica (Ao Selecionar Paciente)
- Visualização de todas as etapas por fase
- Status visual (PENDING, IN_PROGRESS, COMPLETED, OVERDUE)
- Datas esperadas e prazos
- Botão para marcar etapa como concluída
- Notas sobre cada etapa

### 4. Filtros e Busca
- Filtrar por fase da jornada
- Filtrar por tipo de câncer
- Filtrar por status de etapa (OVERDUE, PENDING, etc.)
- Buscar por nome do paciente

### 5. Checklist de Turno (Já Implementado)
- Início de turno
- Fim de turno

---

## 🔄 Fluxo de Trabalho do Enfermeiro

### Início do Turno
1. Abrir checklist de início de turno
2. Ver métricas do dia anterior
3. Ver lista de pacientes com etapas críticas
4. Priorizar ações do dia

### Durante o Turno
1. Selecionar paciente da lista
2. Ver etapas de navegação
3. Identificar etapas atrasadas/pendentes
4. Adicionar notas internas sobre ações tomadas
5. Marcar etapas como concluídas (quando aplicável)
6. Registrar intervenções realizadas

### Fim do Turno
1. Completar checklist de fim de turno
2. Revisar pacientes atendidos
3. Atualizar notas de passagem de plantão

---

## 📋 Funcionalidades Detalhadas

### Lista de Pacientes com Etapas Críticas

**Card de Paciente:**
```
┌─────────────────────────────────────────┐
│ [Badge: CRITICAL] João Silva, 65 anos  │
│ Câncer Colorretal | Fase: DIAGNOSIS    │
│                                         │
│ ⚠️ Etapa Atrasada: Colonoscopia        │
│    com Biópsia                          │
│    Atraso: 5 dias                       │
│                                         │
│ Progresso: 3/8 etapas (37%)           │
│                                         │
│ [Ver Navegação] [Adicionar Nota]       │
└─────────────────────────────────────────┘
```

**Ordenação:**
1. Etapas OVERDUE obrigatórias (mais dias primeiro)
2. Etapas obrigatórias próximas do prazo
3. Pacientes com alertas de navegação
4. Outros pacientes ativos

### Painel de Navegação (Ao Selecionar Paciente)

**Estrutura:**
- Abas por fase: SCREENING | DIAGNOSIS | TREATMENT | FOLLOW_UP
- Cada etapa mostra:
  - Status (badge colorido)
  - Nome e descrição
  - Data esperada e prazo
  - Data de conclusão (se aplicável)
  - Badge "Obrigatória" se necessário
  - Botão "Marcar como Concluída"
  - Notas sobre a etapa

**Indicadores:**
- Contador de etapas concluídas por fase
- Contador de etapas atrasadas
- Badge "Fase Atual" na fase do paciente

---

## 🎯 Priorização (RICE Score)

### Feature 1: Lista de Pacientes com Etapas Críticas
- **Reach:** 100% (todos os enfermeiros)
- **Impact:** 3 (impacto muito alto - core do trabalho)
- **Confidence:** 100% (validado com equipe)
- **Effort:** 3 (1-2 semanas)
- **RICE Score:** (100 × 3 × 100) / 3 = **10.000**

### Feature 2: Métricas de Navegação Oncológica
- **Reach:** 100%
- **Impact:** 2 (alto impacto)
- **Confidence:** 90%
- **Effort:** 2 (1 semana)
- **RICE Score:** (100 × 2 × 90) / 2 = **9.000**

### Feature 3: Painel de Navegação Detalhado
- **Reach:** 100%
- **Impact:** 2 (alto impacto)
- **Confidence:** 80%
- **Effort:** 5 (2-3 semanas)
- **RICE Score:** (100 × 2 × 80) / 5 = **3.200**

---

## ✅ Checklist de Implementação

### Backend
- [ ] Endpoint para listar pacientes com etapas críticas
- [ ] Endpoint para métricas de navegação oncológica
- [ ] Endpoint para etapas de navegação por paciente
- [ ] Filtros por fase, tipo de câncer, status

### Frontend
- [ ] Componente de métricas de navegação oncológica
- [ ] Lista de pacientes com etapas críticas
- [ ] Painel de navegação detalhado (reutilizar `OncologyNavigationPanel`)
- [ ] Filtros e busca
- [ ] Integração com notas internas e intervenções

---

## 📚 Referências

- **NCCN Guidelines** - Colorectal Cancer Navigation
- **ASCO Guidelines** - Oncology Navigation Best Practices
- **Documentação:** `docs/desenvolvimento/navegacao-oncologica-colorretal.md`
- **Componente Existente:** `frontend/src/components/dashboard/oncology-navigation-panel.tsx`

