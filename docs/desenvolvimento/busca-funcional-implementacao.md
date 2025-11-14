# Busca Funcional de Pacientes - Implementação

**Data:** 2024-01-XX  
**Status:** ✅ Implementado  
**Prioridade:** 🔴 ALTA (UX e Produtividade)

---

## 📋 Resumo

Implementação da busca funcional de pacientes por nome ou CPF parcial, com debounce de 300ms para otimizar performance e manter a ordenação por prioridade mesmo após filtrar.

---

## ✅ Funcionalidades Implementadas

### 1. **Hook de Debounce**

**Arquivo:** `frontend/src/lib/utils/use-debounce.ts`

- ✅ Hook customizado `useDebounce` para atrasar atualizações
- ✅ Delay configurável (padrão: 300ms)
- ✅ Evita requisições/filtros a cada tecla digitada
- ✅ Melhora performance e UX

**Uso:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);
```

### 2. **Função de Filtro**

**Arquivo:** `frontend/src/lib/utils/patient-filtering.ts`

- ✅ Busca por **nome** (case-insensitive, parcial)
- ✅ Busca por **CPF** (remove formatação, busca parcial)
- ✅ Retorna lista filtrada mantendo estrutura original
- ✅ Se termo vazio, retorna todos os pacientes

**Lógica:**
```typescript
// Busca por nome
const nameMatch = patient.name.toLowerCase().includes(normalizedSearch);

// Busca por CPF (remove formatação)
const cpfMatch = patient.cpf
  ? patient.cpf.replace(/\D/g, '').includes(normalizedSearch.replace(/\D/g, ''))
  : false;
```

### 3. **Integração no Chat**

**Arquivo:** `frontend/src/app/chat/page.tsx`

- ✅ Estado `searchTerm` para controlar input
- ✅ Debounce aplicado antes de passar para componente
- ✅ Campo de busca visível apenas na aba "Pacientes"
- ✅ Placeholder informativo: "Buscar paciente (nome ou CPF)..."

**Arquivo:** `frontend/src/components/dashboard/patient-list-connected.tsx`

- ✅ Recebe `searchTerm` como prop
- ✅ Aplica filtro antes de ordenar
- ✅ Mantém ordenação por prioridade após filtrar
- ✅ Mensagem quando nenhum resultado encontrado

---

## 🎯 Fluxo de Funcionamento

```
1. Usuário digita no campo de busca
   ↓
2. Estado `searchTerm` atualiza imediatamente (input responsivo)
   ↓
3. Hook `useDebounce` aguarda 300ms sem novas digitações
   ↓
4. `debouncedSearchTerm` atualiza
   ↓
5. `PatientListConnected` recebe termo debounced
   ↓
6. Função `filterPatientsBySearch` filtra lista
   ↓
7. Função `sortPatientsByPriority` ordena resultados filtrados
   ↓
8. Lista exibida mantém ordem de prioridade (CRITICAL > HIGH > MEDIUM > LOW)
```

---

## 🎨 Comportamento da UI

### Estado Vazio (sem busca)
- Exibe todos os pacientes ordenados por prioridade

### Durante Digitação
- Input atualiza imediatamente (feedback visual)
- Lista não filtra até 300ms sem digitação
- Evita "piscar" de resultados

### Após Busca
- Lista filtrada mantém ordenação por prioridade
- Casos críticos ainda aparecem primeiro
- Mensagem clara quando nenhum resultado

### Exemplos de Busca

**Por Nome:**
- "João" → encontra "João Silva", "João Pedro", etc.
- "maria" → encontra "Maria", "Maria José" (case-insensitive)

**Por CPF:**
- "123" → encontra CPFs contendo "123"
- "123.456" → remove pontos, busca "123456"
- "123456789" → busca parcial em qualquer parte do CPF

---

## 📁 Arquivos Criados/Modificados

### Frontend

**Criado:**
- `frontend/src/lib/utils/use-debounce.ts`
  - Hook customizado para debounce

- `frontend/src/lib/utils/patient-filtering.ts`
  - Função de filtro por nome/CPF

**Modificado:**
- `frontend/src/app/chat/page.tsx`
  - Adicionado estado `searchTerm` e `debouncedSearchTerm`
  - Conectado input ao estado
  - Passa termo debounced para componente

- `frontend/src/components/dashboard/patient-list-connected.tsx`
  - Adicionado prop `searchTerm`
  - Aplica filtro antes de ordenar
  - Mensagem quando nenhum resultado

### Documentação

**Modificado:**
- `docs/desenvolvimento/estado-atual-proximos-passos.md`
  - Marca busca funcional como implementada

---

## 🧪 Como Testar

1. **Busca por Nome:**
   - Digitar "João" no campo de busca
   - Aguardar 300ms
   - Verificar que apenas pacientes com "João" no nome aparecem
   - Verificar que ordenação por prioridade é mantida

2. **Busca por CPF:**
   - Digitar "123" no campo de busca
   - Verificar que pacientes com CPF contendo "123" aparecem
   - Testar com CPF formatado: "123.456.789-00"
   - Verificar que formatação é ignorada

3. **Debounce:**
   - Digitar rapidamente várias letras
   - Verificar que filtro só aplica após 300ms sem digitação
   - Verificar que não há "piscar" de resultados

4. **Limpar Busca:**
   - Digitar algo e depois apagar tudo
   - Verificar que todos os pacientes voltam a aparecer
   - Verificar que ordenação por prioridade é mantida

5. **Nenhum Resultado:**
   - Buscar por termo que não existe (ex: "XYZ123")
   - Verificar mensagem: "Nenhum paciente encontrado para 'XYZ123'"

---

## 🔄 Próximos Passos Relacionados

- [ ] **Busca avançada** - Buscar por tipo de câncer, estágio, etc.
- [ ] **Filtros combinados** - Combinar busca com filtros de categoria
- [ ] **Histórico de buscas** - Salvar buscas recentes
- [ ] **Sugestões de busca** - Autocomplete enquanto digita
- [ ] **Busca no backend** - Para grandes volumes, buscar diretamente no banco

---

## 📝 Notas Técnicas

### Performance

- **Debounce de 300ms:** Balanceia responsividade e performance
  - Muito curto (<100ms): muitas operações desnecessárias
  - Muito longo (>500ms): input parece "travado"

- **Filtro em memória:** Adequado para volumes típicos (<1000 pacientes)
  - Para volumes maiores, considerar busca no backend
  - Prisma suporta `where` com `contains` para busca no banco

### Acessibilidade

- ✅ Input com `type="text"` e placeholder descritivo
- ✅ Placeholder indica que busca por nome ou CPF
- ✅ Mensagem clara quando nenhum resultado
- ⚠️ **Melhorias futuras:** Adicionar `aria-label` e `aria-describedby`

### Manutenibilidade

- Função `filterPatientsBySearch` pode ser reutilizada
- Hook `useDebounce` genérico, pode ser usado em outros lugares
- Lógica de filtro separada facilita testes e manutenção

---

## ✅ Checklist de Implementação

- [x] Hook de debounce criado
- [x] Função de filtro por nome implementada
- [x] Função de filtro por CPF implementada
- [x] Estado de busca no componente principal
- [x] Input conectado ao estado
- [x] Debounce aplicado antes de filtrar
- [x] Filtro aplicado antes de ordenar
- [x] Ordenação por prioridade mantida após filtrar
- [x] Mensagem quando nenhum resultado
- [x] Placeholder informativo
- [x] Documentação atualizada

---

**Última atualização:** 2024-01-XX

