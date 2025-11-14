# Melhorias Prioritárias do Dashboard - Plano de Implementação

**Baseado em:** Análise com Especialista Healthtech  
**Data:** 2024-01-XX  
**Priorização:** Baseada em impacto clínico e segurança do paciente

---

## 🔴 FASE 1 - CRÍTICO (Sprint 1-2)

### 1.1 Ordenação Automática por Prioridade

**Problema:** Pacientes não estão ordenados, casos críticos podem passar despercebidos.

**Solução:**
```typescript
// backend/src/patients/patients.service.ts
async findAll(tenantId: string): Promise<Patient[]> {
  return this.prisma.patient.findMany({
    where: { tenantId },
    orderBy: [
      { priorityScore: 'desc' }, // Maior score primeiro
      { updatedAt: 'desc' }, // Mais recentes primeiro
    ],
    include: {
      _count: {
        select: {
          alerts: { where: { status: 'PENDING' } },
          messages: true,
          observations: true,
        },
      },
    },
  });
}
```

**Frontend:**
- Ordenação já está no backend, apenas garantir que está sendo aplicada
- Adicionar indicador visual de ordenação atual

**Impacto:** 🔴 ALTO - Segurança do paciente

---

### 1.2 Filtros Básicos

**Implementar:**
- Por categoria (Crítico/Alto/Médio/Baixo)
- Por alertas pendentes (sim/não)
- Por tipo de câncer

**Código:**
```typescript
// frontend/src/components/dashboard/patient-list-connected.tsx
const [filters, setFilters] = useState({
  category: 'all',
  hasAlerts: 'all',
  cancerType: 'all',
});

const filteredPatients = transformedPatients.filter((patient) => {
  if (filters.category !== 'all' && patient.priorityCategory !== filters.category) {
    return false;
  }
  if (filters.hasAlerts === 'yes' && patient.alertCount === 0) {
    return false;
  }
  if (filters.hasAlerts === 'no' && patient.alertCount > 0) {
    return false;
  }
  if (filters.cancerType !== 'all' && patient.cancerType !== filters.cancerType) {
    return false;
  }
  return true;
});
```

**Impacto:** 🔴 ALTO - Eficiência operacional

---

### 1.3 Busca Funcional

**Implementar:**
- Busca por nome (case-insensitive)
- Busca por CPF parcial
- Debounce de 300ms

**Código:**
```typescript
// frontend/src/components/dashboard/patient-list-connected.tsx
const [searchQuery, setSearchQuery] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

const filteredPatients = transformedPatients.filter((patient) => {
  if (!debouncedSearch) return true;
  
  const query = debouncedSearch.toLowerCase();
  return (
    patient.name.toLowerCase().includes(query) ||
    patient.cpf?.includes(query) ||
    patient.phone?.includes(query)
  );
});
```

**Impacto:** 🟡 MÉDIO - UX significativamente melhor

---

### 1.4 Alertas Críticos no Header

**Implementar:**
- Badge vermelho com contador de alertas CRITICAL pendentes
- Notificação visual (piscante opcional)
- Link direto para alertas críticos

**Código:**
```typescript
// frontend/src/app/dashboard/page.tsx
const { data: criticalAlerts } = useAlerts('PENDING'); // Filtrar por severity CRITICAL no backend

// No header:
{criticalAlerts && criticalAlerts.filter(a => a.severity === 'CRITICAL').length > 0 && (
  <div className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg animate-pulse">
    <AlertTriangle className="h-5 w-5" />
    <span className="font-bold">
      {criticalAlerts.filter(a => a.severity === 'CRITICAL').length} ALERTAS CRÍTICOS
    </span>
  </div>
)}
```

**Backend:**
```typescript
// backend/src/alerts/alerts.service.ts
async findCriticalPending(tenantId: string): Promise<Alert[]> {
  return this.prisma.alert.findMany({
    where: {
      tenantId,
      status: 'PENDING',
      severity: 'CRITICAL',
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**Impacto:** 🔴 ALTO - Segurança do paciente

---

## 🟡 FASE 2 - IMPORTANTE (Sprint 3-4)

### 2.1 Informações Clínicas no Card

**Adicionar ao card:**
- "Última consulta: há X dias"
- "Próxima consulta: em X dias" (se houver)
- Badge "Em tratamento ativo"

**Requer:**
- Adicionar campos `lastAppointment` e `nextAppointment` ao modelo Patient
- Ou buscar de Observation/PatientJourney

---

### 2.2 Tooltip Explicativo do Score

**Implementar:**
- Hover no score mostra tooltip com razão
- Exemplo: "Score 90: Dor intensa (8/10) + Estágio IV + Sem resposta há 3 dias"

**Requer:**
- Campo `priorityReason` já existe no schema
- Apenas exibir em tooltip

---

### 2.3 Feedback Visual de Conversas Assumidas

**Implementar:**
- Badge "Assumido por: [Nome]" no card
- Borda verde para conversas assumidas
- Filtro "Minhas Conversas"

**Requer:**
- Endpoint para assumir conversa (já existe)
- Armazenar `assumedBy` e `assumedAt` na Message
- Filtrar por usuário atual

---

## 🟢 FASE 3 - MELHORIAS (Sprint 5+)

### 3.1 Métricas e KPIs
### 3.2 Timeline Completa
### 3.3 Notificações Push
### 3.4 Exportação de Dados

---

## 📋 Checklist de Implementação

### Sprint 1
- [ ] Ordenação automática por prioridade (backend)
- [ ] Filtros básicos (frontend)
- [ ] Busca funcional com debounce
- [ ] Alertas críticos no header

### Sprint 2
- [ ] Testes com enfermeiros
- [ ] Ajustes baseados em feedback
- [ ] Documentação de uso

### Sprint 3
- [ ] Informações clínicas no card
- [ ] Tooltip explicativo do score
- [ ] Feedback visual de conversas assumidas

---

## 🎯 Métricas de Sucesso

**Após Fase 1:**
- Tempo para encontrar paciente crítico: < 5 segundos
- Taxa de alertas críticos não visualizados: < 1%
- Satisfação da equipe de enfermagem: > 4/5

**Após Fase 2:**
- Redução de 30% no tempo de navegação
- Aumento de 20% na resolução de alertas
- Melhoria na continuidade de cuidado

