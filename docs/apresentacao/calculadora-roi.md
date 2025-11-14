# Calculadora Interativa de ROI
## Plataforma de Otimização Oncológica

### Descrição

Calculadora web interativa que permite gestores hospitalares inserirem:
- Número de pacientes oncológicos/mês
- Tipo de hospital/clínica
- Dados opcionais (taxa de readmissão atual, custo médio de consulta, etc.)

E visualizarem:
- Economia estimada anual
- ROI projetado
- Payback period
- Comparativo antes/depois

---

## Especificações Técnicas

### Frontend (Next.js)

**Componente: CalculadoraROI**

```typescript
interface ROIInputs {
  numPacientes: number
  tipoInstituicao: 'clinica-pequena' | 'hospital-medio' | 'hospital-grande'
  taxaReadmissaoAtual?: number // %
  custoMedioConsulta?: number // R$
  custoReadmissao?: number // R$
  numConsultasMes?: number // por paciente
}

interface ROIOutputs {
  investimentoMensal: number
  investimentoAnual: number
  economiaReadmissoes: number
  economiaConsultas: number
  economiaEficiencia: number
  economiaDetecaoPrecoce: number
  economiaTotal: number
  roi: number // multiplicador
  paybackPeriod: number // meses
  economiaPorPaciente: number
}
```

### Fórmulas de Cálculo

**1. Investimento Mensal**
```typescript
function calcularInvestimento(numPacientes: number, tipoInstituicao: string): number {
  if (numPacientes <= 100) {
    return 5000 // Tier 1
  } else if (numPacientes <= 500) {
    return 15000 // Tier 2
  } else {
    return 30000 + ((numPacientes - 500) * 30) // Tier 3
  }
}
```

**2. Economia de Readmissões**
```typescript
function calcularEconomiaReadmissoes(
  numPacientes: number,
  taxaReadmissaoAtual: number,
  custoReadmissao: number
): number {
  // Redução de 25% na taxa de readmissão
  const reducao = 0.25
  const readmissoesEvitadas = (numPacientes * taxaReadmissaoAtual * reducao) / 100
  return readmissoesEvitadas * custoReadmissao * 12 // anual
}
```

**3. Economia de Consultas**
```typescript
function calcularEconomiaConsultas(
  numPacientes: number,
  numConsultasMes: number,
  custoMedioConsulta: number
): number {
  // Redução de 40% em consultas presenciais
  const reducao = 0.40
  const consultasEvitadas = numPacientes * numConsultasMes * reducao
  return consultasEvitadas * custoMedioConsulta * 12 // anual
}
```

**4. Economia por Eficiência**
```typescript
function calcularEconomiaEficiencia(numPacientes: number): number {
  // Baseado em economia de tempo da equipe
  // Estimativa: R$ 50-100 por paciente/ano
  const economiaPorPaciente = 75
  return numPacientes * economiaPorPaciente
}
```

**5. Economia por Detecção Precoce**
```typescript
function calcularEconomiaDetecaoPrecoce(numPacientes: number): number {
  // Baseado em complicações evitadas
  // Estimativa: R$ 100-200 por paciente/ano
  const economiaPorPaciente = 150
  return numPacientes * economiaPorPaciente
}
```

**6. ROI Total**
```typescript
function calcularROI(
  investimentoAnual: number,
  economiaTotal: number
): number {
  return economiaTotal / investimentoAnual
}
```

**7. Payback Period**
```typescript
function calcularPaybackPeriod(
  investimentoMensal: number,
  economiaMensal: number,
  setupInicial: number = 20000
): number {
  // Considerando setup inicial
  const economiaAposSetup = economiaMensal - investimentoMensal
  if (economiaAposSetup <= 0) return Infinity
  
  const mesesParaCobrirSetup = setupInicial / economiaAposSetup
  return mesesParaCobrirSetup
}
```

---

## Interface do Usuário

### Layout da Calculadora

**Seção 1: Inputs**

```
┌─────────────────────────────────────────┐
│  Calculadora de ROI                     │
│  Plataforma de Otimização Oncológica    │
├─────────────────────────────────────────┤
│                                          │
│  Número de Pacientes/Mês:               │
│  [_______] pacientes                    │
│                                          │
│  Tipo de Instituição:                   │
│  ( ) Clínica Pequena                    │
│  ( ) Hospital Médio                     │
│  (•) Hospital Grande                    │
│                                          │
│  [Opções Avançadas ▼]                   │
│                                          │
│  Taxa de Readmissão Atual:              │
│  [___] % (padrão: 15%)                  │
│                                          │
│  Custo Médio de Consulta:               │
│  R$ [____] (padrão: R$ 300)             │
│                                          │
│  Custo Médio de Readmissão:             │
│  R$ [_____] (padrão: R$ 25.000)         │
│                                          │
│  Consultas por Paciente/Mês:            │
│  [__] (padrão: 2)                       │
│                                          │
└─────────────────────────────────────────┘
```

**Seção 2: Resultados**

```
┌─────────────────────────────────────────┐
│  Resultados Projetados                  │
├─────────────────────────────────────────┤
│                                          │
│  💰 INVESTIMENTO                        │
│  Mensal: R$ 30.000                      │
│  Anual: R$ 360.000                      │
│  Setup: R$ 20.000 (único)               │
│                                          │
│  💵 ECONOMIA ANUAL                      │
│  Readmissões: R$ 450.000                │
│  Consultas: R$ 180.000                  │
│  Eficiência: R$ 75.000                  │
│  Detecção Precoce: R$ 150.000           │
│  ─────────────────────────────          │
│  TOTAL: R$ 855.000                      │
│                                          │
│  📊 ROI                                 │
│  Multiplicador: 2.4x                    │
│  Payback: 3.2 meses                     │
│  Economia/Paciente: R$ 712/ano          │
│                                          │
│  [📥 Baixar Relatório PDF]              │
│  [📧 Enviar por Email]                  │
│                                          │
└─────────────────────────────────────────┘
```

**Seção 3: Comparativo Visual**

```
┌─────────────────────────────────────────┐
│  Comparativo Antes vs Depois            │
├─────────────────────────────────────────┤
│                                          │
│  Readmissões Anuais:                    │
│  Antes: ████████████████ 120            │
│  Depois: ████████████ 90                │
│  Redução: 25%                           │
│                                          │
│  Consultas Anuais:                      │
│  Antes: ████████████████████████████    │
│         2.400 consultas                 │
│  Depois: ████████████████████           │
│          1.440 consultas                │
│  Redução: 40%                           │
│                                          │
│  Tempo de Resposta (Alertas):           │
│  Antes: ████████████ 72 horas           │
│  Depois: ██ 15 minutos                  │
│  Melhoria: 99%                          │
│                                          │
└─────────────────────────────────────────┘
```

---

## Funcionalidades

### 1. Cálculo Automático
- Atualização em tempo real conforme usuário digita
- Valores padrão baseados em benchmarks da indústria
- Validação de inputs (números positivos, limites razoáveis)

### 2. Personalização
- Opções avançadas (colapsáveis)
- Valores padrão editáveis
- Salvar/recarregar cenários

### 3. Exportação
- PDF do relatório
- Excel com todos os cálculos
- Envio por email

### 4. Comparativos
- Gráficos visuais (antes/depois)
- Múltiplos cenários
- Comparação entre tiers

### 5. Validação Clínica
- Assumptions documentadas
- Fontes dos benchmarks
- Disclaimer sobre projeções

---

## Assumptions e Benchmarks

### Valores Padrão

**Taxa de Readmissão:**
- Benchmark indústria: 15-20%
- Redução esperada: 25%

**Custo de Readmissão:**
- Clínica pequena: R$ 15.000
- Hospital médio: R$ 25.000
- Hospital grande: R$ 35.000

**Custo de Consulta:**
- Benchmark: R$ 200-500
- Padrão: R$ 300

**Consultas por Paciente/Mês:**
- Benchmark: 1-3 consultas
- Padrão: 2 consultas

**Reduções Esperadas:**
- Readmissões: 25%
- Consultas presenciais: 40%
- Tempo de resposta: 99% (horas → minutos)
- Eficiência da equipe: +15%

---

## Disclaimer

**Importante:**
- Os valores apresentados são estimativas baseadas em benchmarks da indústria
- Resultados reais podem variar conforme:
  - Perfil de pacientes
  - Protocolos de tratamento
  - Estrutura organizacional
  - Nível de adesão da equipe
- Recomendamos um piloto de 30 dias para validação
- ROI real deve ser medido após implementação completa

---

## Implementação

### Arquivos a Criar

1. `frontend/src/components/roi-calculator/ROICalculator.tsx`
2. `frontend/src/components/roi-calculator/ROIInputs.tsx`
3. `frontend/src/components/roi-calculator/ROIResults.tsx`
4. `frontend/src/components/roi-calculator/ROIComparison.tsx`
5. `frontend/src/lib/roi-calculations.ts`
6. `frontend/src/app/calculadora-roi/page.tsx`

### Dependências Adicionais

```json
{
  "recharts": "^2.12.0",
  "jspdf": "^2.5.1",
  "xlsx": "^0.18.5"
}
```

---

## Próximos Passos

1. Implementar componente React
2. Adicionar gráficos visuais
3. Implementar exportação PDF/Excel
4. Adicionar validação de inputs
5. Criar página dedicada
6. Testes de usabilidade


