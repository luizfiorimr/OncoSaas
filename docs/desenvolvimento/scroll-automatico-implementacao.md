# Scroll Automático para Paciente Selecionado - Implementação

## Resumo

Implementação de scroll automático para rolar até o card do paciente na lista quando ele é selecionado externamente (ex: via clique em alerta). Melhora a experiência do usuário ao garantir que o paciente selecionado esteja visível na lista.

## Data de Implementação

2024-01-XX

## Funcionalidades Implementadas

### Scroll Automático

- **Localização**: Lista de pacientes (`PatientList`)
- **Comportamento**: Quando um paciente é selecionado externamente (via prop `selectedPatientId`), a lista rola automaticamente até o card correspondente
- **Animação**: Scroll suave (`behavior: 'smooth'`)
- **Posicionamento**: `block: 'nearest'` - apenas rola o necessário para tornar o elemento visível, sem forçar scroll completo

## Arquivos Modificados

### Frontend

1. **`frontend/src/components/dashboard/patient-list.tsx`**
   - Adicionado import de `useEffect` e `useRef` do React
   - Criado `patientRefs` usando `useRef<Record<string, HTMLDivElement | null>>({})`
   - Adicionado `ref` em cada card de paciente para armazenar referência ao elemento DOM
   - Implementado `useEffect` que detecta mudanças em `selectedPatientId` e faz scroll automático
   - Delay de 100ms para garantir que o DOM foi atualizado antes do scroll

## Detalhes de Implementação

### Refs para Cards de Paciente

```typescript
const patientRefs = useRef<Record<string, HTMLDivElement | null>>({});
```

**Características:**
- Objeto que mapeia `patientId` para o elemento DOM correspondente
- Permite acessar o elemento específico quando necessário

### Atribuição de Ref

```typescript
<div
  key={patient.id}
  ref={(el) => {
    patientRefs.current[patient.id] = el;
  }}
  // ... outras props
>
```

**Características:**
- Cada card de paciente armazena sua referência no objeto `patientRefs`
- Usa callback ref para atualizar o objeto quando o elemento é renderizado

### Scroll Automático

```typescript
useEffect(() => {
  if (selectedPatientId && patientRefs.current[selectedPatientId]) {
    // Pequeno delay para garantir que o DOM foi atualizado
    const timeoutId = setTimeout(() => {
      patientRefs.current[selectedPatientId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // Não força scroll completo, apenas o necessário
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }
}, [selectedPatientId]);
```

**Características:**
- Executa apenas quando `selectedPatientId` muda
- Verifica se o paciente existe na lista antes de fazer scroll
- Delay de 100ms para garantir que o DOM foi atualizado (especialmente importante após filtros)
- `behavior: 'smooth'` para animação suave
- `block: 'nearest'` para rolar apenas o necessário (não força scroll completo)
- Cleanup do timeout para evitar vazamentos de memória

## Fluxo de Funcionamento

1. **Seleção Externa**:
   - Usuário clica em um alerta ou paciente é selecionado programaticamente
   - `selectedPatientId` é atualizado na página pai (`ChatPage`)

2. **Propagação**:
   - `selectedPatientId` é passado para `PatientListConnected`
   - `PatientListConnected` passa para `PatientList`

3. **Detecção**:
   - `useEffect` em `PatientList` detecta mudança em `selectedPatientId`
   - Verifica se o elemento existe em `patientRefs.current`

4. **Scroll**:
   - Após delay de 100ms, chama `scrollIntoView` no elemento correspondente
   - Scroll suave até o card do paciente

## Casos de Uso

### 1. Clique em Alerta

**Cenário**: Usuário clica em um alerta crítico no painel de alertas.

**Fluxo**:
1. `onAlertSelect` é chamado
2. `setSelectedAlert(alert)` atualiza o alerta selecionado
3. `setSelectedPatient(alert.patientId)` atualiza o paciente selecionado
4. `setActiveTab('patients')` muda para aba de pacientes
5. `PatientList` recebe novo `selectedPatientId`
6. Scroll automático rola até o card do paciente

### 2. Seleção Programática

**Cenário**: Sistema seleciona automaticamente um paciente (ex: após receber mensagem crítica).

**Fluxo**:
1. Sistema atualiza `selectedPatient` programaticamente
2. `PatientList` recebe novo `selectedPatientId`
3. Scroll automático rola até o card do paciente

### 3. Filtros Aplicados

**Cenário**: Usuário aplica filtros e um paciente específico é selecionado.

**Fluxo**:
1. Filtros são aplicados, lista é filtrada
2. Paciente é selecionado
3. Delay de 100ms garante que a lista filtrada foi renderizada
4. Scroll automático rola até o card do paciente na lista filtrada

## Considerações de Performance

### Delay de 100ms

O delay de 100ms é necessário para:
- Garantir que o DOM foi atualizado após filtros
- Evitar scroll antes do elemento estar visível
- Melhorar experiência do usuário (scroll mais suave)

### Cleanup do Timeout

O cleanup do timeout previne:
- Vazamentos de memória
- Scrolls múltiplos se `selectedPatientId` mudar rapidamente
- Comportamento inesperado

### `block: 'nearest'`

A opção `block: 'nearest'`:
- Rola apenas o necessário para tornar o elemento visível
- Não força scroll completo se o elemento já está parcialmente visível
- Melhora a experiência do usuário (menos movimento desnecessário)

## Melhorias Futuras

1. **Scroll Condicional**:
   - Só fazer scroll se o elemento não estiver visível
   - Usar `IntersectionObserver` para verificar visibilidade

2. **Offset Personalizado**:
   - Adicionar offset para não rolar até a borda
   - Ex: `scrollIntoView({ block: 'center' })` para centralizar

3. **Scroll para Container Pai**:
   - Se a lista está dentro de um container scrollável, rolar o container
   - Usar `scrollIntoView` no container pai se necessário

4. **Animação Customizada**:
   - Usar biblioteca de animação (ex: Framer Motion) para scroll mais suave
   - Adicionar efeito de "pulse" no card após scroll

5. **Scroll Manual vs Automático**:
   - Detectar se o scroll foi causado por seleção externa ou clique direto
   - Só fazer scroll automático se foi seleção externa

## Testes

### Teste Manual

1. **Clique em Alerta**:
   - Clicar em um alerta no painel de alertas
   - Verificar se a lista rola até o paciente correspondente
   - Verificar se o scroll é suave

2. **Filtros Aplicados**:
   - Aplicar filtros que ocultam o paciente selecionado
   - Selecionar um paciente que está visível após filtros
   - Verificar se o scroll funciona corretamente

3. **Múltiplas Seleções Rápidas**:
   - Selecionar pacientes diferentes rapidamente
   - Verificar se o scroll não causa "travamento" ou comportamento estranho

4. **Paciente Já Visível**:
   - Selecionar um paciente que já está visível na tela
   - Verificar se não há scroll desnecessário

## Referências

- [MDN - scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView)
- [React - useRef](https://react.dev/reference/react/useRef)
- [React - useEffect](https://react.dev/reference/react/useEffect)
- [Documentação de Melhorias de UX](./melhorias-ux-implementacao.md)

