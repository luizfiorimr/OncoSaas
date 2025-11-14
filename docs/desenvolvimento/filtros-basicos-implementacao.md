# Filtros Básicos - Implementação

**Data:** 2024-01-XX  
**Status:** ✅ Implementado  
**Prioridade:** 🔴 ALTA (Produtividade e UX)

---

## 📋 Resumo

Implementação de filtros básicos para a lista de pacientes, permitindo filtrar por:
- **Categoria de prioridade** (CRITICAL, HIGH, MEDIUM, LOW)
- **Alertas pendentes** (apenas pacientes com alertas)
- **Tipo de câncer** (dropdown com tipos únicos)

Os filtros funcionam em conjunto com a busca existente e são aplicados antes da ordenação por prioridade.

---

## ✅ Funcionalidades Implementadas

### 1. **Filtro por Categoria de Prioridade**

**Arquivo:** `frontend/src/app/chat/page.tsx`

- ✅ Botões para cada categoria (Crítico, Alto, Médio, Baixo)
- ✅ Cores diferentes para cada categoria quando ativo
- ✅ Toggle: clicar novamente remove o filtro
- ✅ Botão "Limpar" aparece quando um filtro está ativo
- ✅ Visual claro do filtro ativo

**Código:**
```typescript
const [priorityFilter, setPriorityFilter] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null>(null);

// UI com botões para cada prioridade
{(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => (
  <button
    onClick={() => setPriorityFilter(priorityFilter === priority ? null : priority)}
    className={/* cores específicas por prioridade */}
  >
    {priority === 'CRITICAL' ? 'Crítico' : ...}
  </button>
))}
```

### 2. **Filtro por Alertas Pendentes**

**Arquivo:** `frontend/src/app/chat/page.tsx`

- ✅ Checkbox "Apenas com alertas"
- ✅ Quando marcado, mostra apenas pacientes com `_count.alerts > 0`
- ✅ Filtro combinável com outros filtros

**Código:**
```typescript
const [hasAlertsFilter, setHasAlertsFilter] = useState<boolean>(false);

// UI com checkbox
<input
  type="checkbox"
  checked={hasAlertsFilter}
  onChange={(e) => setHasAlertsFilter(e.target.checked)}
/>
```

### 3. **Filtro por Tipo de Câncer**

**Arquivo:** `frontend/src/app/chat/page.tsx`

- ✅ Dropdown com tipos de câncer únicos
- ✅ Tipos extraídos de `cancerDiagnoses` (múltiplos diagnósticos) ou `cancerType` (legado)
- ✅ Opção "Todos os tipos" para remover filtro
- ✅ Busca case-insensitive e parcial

**Código:**
```typescript
const [cancerTypeFilter, setCancerTypeFilter] = useState<string>('');

// Obter tipos únicos
const uniqueCancerTypes = Array.from(
  new Set(
    patients?.flatMap((p) => {
      if (p.cancerDiagnoses && p.cancerDiagnoses.length > 0) {
        return p.cancerDiagnoses.map((d) => d.cancerType);
      }
      return p.cancerType ? [p.cancerType] : [];
    }).filter((type): type is string => !!type) || []
  )
).sort();
```

### 4. **Função de Filtro Unificada**

**Arquivo:** `frontend/src/lib/utils/patient-filtering.ts`

- ✅ Nova função `filterPatients()` que aceita múltiplos filtros
- ✅ Interface `PatientFilters` para tipagem
- ✅ Filtros aplicados sequencialmente
- ✅ Compatível com busca existente

**Código:**
```typescript
export interface PatientFilters {
  searchTerm?: string;
  priorityCategory?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
  hasAlerts?: boolean;
  cancerType?: string | null;
}

export function filterPatients(
  patients: Patient[],
  filters: PatientFilters
): Patient[] {
  let filtered = [...patients];

  // Aplicar cada filtro sequencialmente
  if (filters.searchTerm) {
    filtered = filterPatientsBySearch(filtered, filters.searchTerm);
  }
  if (filters.priorityCategory) {
    filtered = filtered.filter(
      (patient) => patient.priorityCategory === filters.priorityCategory
    );
  }
  if (filters.hasAlerts === true) {
    filtered = filtered.filter(
      (patient) => (patient._count?.alerts || 0) > 0
    );
  }
  if (filters.cancerType) {
    // Busca em cancerDiagnoses ou cancerType legado
    filtered = filtered.filter(/* ... */);
  }

  return filtered;
}
```

### 5. **Limpar Todos os Filtros**

**Arquivo:** `frontend/src/app/chat/page.tsx`

- ✅ Botão "Limpar todos os filtros" aparece quando há filtros ativos
- ✅ Reseta todos os filtros de uma vez
- ✅ Visual claro e acessível

**Código:**
```typescript
{(priorityFilter || hasAlertsFilter || cancerTypeFilter) && (
  <button
    onClick={() => {
      setPriorityFilter(null);
      setHasAlertsFilter(false);
      setCancerTypeFilter('');
    }}
  >
    <X className="h-3 w-3" />
    Limpar todos os filtros
  </button>
)}
```

---

## 🎯 Fluxo de Funcionamento

```
1. Usuário aplica filtros (prioridade, alertas, tipo de câncer)
   ↓
2. Filtros são combinados com busca (se houver)
   ↓
3. Função filterPatients() aplica todos os filtros sequencialmente
   ↓
4. Lista filtrada é ordenada por prioridade (CRITICAL > HIGH > MEDIUM > LOW)
   ↓
5. Resultados são exibidos na lista de pacientes
   ↓
6. Se não houver resultados, mostra mensagem apropriada
```

---

## 🎨 Comportamento da UI

### Filtros Visuais:

**Prioridade:**
- Botões com cores específicas quando ativo:
  - Crítico: Vermelho (`bg-red-600`)
  - Alto: Laranja (`bg-orange-600`)
  - Médio: Amarelo (`bg-yellow-600`)
  - Baixo: Cinza (`bg-gray-600`)
- Botão "Limpar" aparece quando um filtro está ativo

**Alertas:**
- Checkbox simples
- Label clicável
- Visual claro quando marcado

**Tipo de Câncer:**
- Dropdown com todos os tipos únicos
- Opção "Todos os tipos" no topo
- Ordenado alfabeticamente

### Indicadores:

- Botão "Limpar todos os filtros" aparece quando há qualquer filtro ativo
- Mensagem apropriada quando não há resultados:
  - Com filtros: "Nenhum paciente encontrado com os filtros aplicados"
  - Sem filtros: "Nenhum paciente encontrado"

---

## 📁 Arquivos Modificados

### Frontend

**Modificado:**
- `frontend/src/app/chat/page.tsx`
  - Estados para filtros (`priorityFilter`, `hasAlertsFilter`, `cancerTypeFilter`)
  - UI de filtros (botões, checkbox, dropdown)
  - Lógica para obter tipos de câncer únicos
  - Passa filtros para `PatientListConnected`

- `frontend/src/components/dashboard/patient-list-connected.tsx`
  - Aceita prop `filters` (além de `searchTerm` para compatibilidade)
  - Usa `filterPatients()` em vez de `filterPatientsBySearch()`
  - Mensagens de erro melhoradas

**Criado/Expandido:**
- `frontend/src/lib/utils/patient-filtering.ts`
  - Interface `PatientFilters`
  - Função `filterPatients()` para múltiplos filtros
  - Suporte para `cancerDiagnoses` (múltiplos diagnósticos)

---

## 🧪 Como Testar

1. **Filtro por Prioridade:**
   - Clicar em "Crítico" → Verificar que apenas pacientes críticos aparecem
   - Clicar novamente → Verificar que filtro é removido
   - Clicar em "Alto" → Verificar que apenas pacientes de alta prioridade aparecem
   - Clicar em "Limpar" → Verificar que filtro é removido

2. **Filtro por Alertas:**
   - Marcar checkbox "Apenas com alertas"
   - Verificar que apenas pacientes com `_count.alerts > 0` aparecem
   - Desmarcar → Verificar que todos os pacientes aparecem

3. **Filtro por Tipo de Câncer:**
   - Selecionar um tipo no dropdown
   - Verificar que apenas pacientes com aquele tipo aparecem
   - Selecionar "Todos os tipos" → Verificar que filtro é removido

4. **Filtros Combinados:**
   - Aplicar múltiplos filtros simultaneamente
   - Verificar que todos são aplicados corretamente
   - Clicar em "Limpar todos os filtros" → Verificar que todos são removidos

5. **Filtros + Busca:**
   - Aplicar filtro de prioridade
   - Digitar termo de busca
   - Verificar que busca é aplicada dentro dos resultados filtrados

6. **Sem Resultados:**
   - Aplicar filtros que não retornam resultados
   - Verificar mensagem: "Nenhum paciente encontrado com os filtros aplicados"

---

## 🔄 Próximos Passos Relacionados

- [ ] **Salvar filtros no localStorage** - Persistir filtros entre sessões
- [ ] **Filtros avançados** - Data de diagnóstico, estágio, etc.
- [ ] **Contador de resultados** - Mostrar "X pacientes encontrados"
- [ ] **Filtros rápidos** - Botões pré-configurados (ex: "Casos Críticos", "Com Alertas")
- [ ] **Filtros por URL** - Permitir compartilhar filtros via query params

---

## 📝 Notas Técnicas

### Compatibilidade

- `PatientListConnected` aceita tanto `searchTerm` (legado) quanto `filters` (novo)
- Se `filters` não for fornecido, usa `searchTerm` para compatibilidade
- Permite migração gradual sem quebrar código existente

### Performance

- Filtros são aplicados no cliente (não há requisições ao backend)
- Ordenação acontece após filtros (mais eficiente)
- Tipos de câncer são calculados uma vez quando pacientes são carregados

### Múltiplos Diagnósticos

- Filtro por tipo de câncer verifica tanto `cancerDiagnoses` quanto `cancerType` legado
- Suporta pacientes com múltiplos diagnósticos de câncer
- Busca case-insensitive e parcial

---

## ✅ Checklist de Implementação

- [x] Interface `PatientFilters` criada
- [x] Função `filterPatients()` implementada
- [x] Filtro por prioridade (botões)
- [x] Filtro por alertas (checkbox)
- [x] Filtro por tipo de câncer (dropdown)
- [x] UI de filtros na página de chat
- [x] Botão "Limpar todos os filtros"
- [x] Integração com busca existente
- [x] Mensagens de erro apropriadas
- [x] Suporte para múltiplos diagnósticos
- [x] Compatibilidade com código legado
- [x] Testes manuais realizados

---

**Última atualização:** 2024-01-XX

