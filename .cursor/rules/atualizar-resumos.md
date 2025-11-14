# Regra: Atualização de Resumos Médicos

## Propósito

Esta regra define a metodologia para atualizar automaticamente resumos médicos existentes com informações mais recentes de protocolos, diretrizes, tratamentos, classificações e outras informações temporais, garantindo que os resumos permaneçam atualizados com as melhores evidências disponíveis.

## Princípios Fundamentais

### Informações que DEVEM ser atualizadas

**Temporais (sempre verificar atualização):**
- Protocolos e diretrizes de tratamento
- Tratamentos farmacológicos (doses, escalonamento, novas medicações)
- Classificações e critérios diagnósticos atualizados
- Dados epidemiológicos (prevalência, incidência)
- Metas terapêuticas (valores alvo de exames)
- Algoritmos de decisão clínica baseados em diretrizes
- Aprovação de novas medicações/tecnologias

**Critérios de atualização:**
- Diretrizes/Guidelines: **SEMPRE** verificar versão mais recente (independente da idade)
- Tratamentos: Se fonte >2 anos, buscar atualização
- Epidemiologia: Se dados >3 anos, buscar atualização
- Critérios diagnósticos: Se fonte >5 anos, verificar atualização
- Qualquer informação com fonte >2 anos em seções temporais

### Informações que NÃO devem ser atualizadas

**Atemporais (preservar):**
- Fisiopatologia fundamental (mecanismos básicos)
- Semiologia clássica (técnicas de exame físico)
- Anatomia e histologia básica
- Conceitos fundamentais (definições clássicas)
- Exemplos práticos de casos clínicos
- Fluxogramas de raciocínio clínico (a menos que protocolo específico mude)
- Checklists de atendimento (a menos que critério específico mude)
- Pearls clínicas e dicas práticas

**Justificativa:**
Informações conceituais e técnicas básicas permanecem válidas mesmo em fontes antigas, enquanto protocolos e diretrizes mudam com novas evidências.

## Estratégia de Identificação de Informações Temporais

### Padrões de Busca no Texto

**Seções específicas a analisar:**
- `## Tratamento` ou `### Tratamento`
- `## Protocolo` ou `### Protocolo`
- `## Epidemiologia`
- `## Critérios Diagnósticos` ou `### Critérios Diagnósticos`
- `## Classificação` ou `### Classificação`
- `## Estratificação de Risco`
- `**Fontes e Versões:**` ou `## Fontes e Versões`

**Padrões de citação a extrair:**
- `([ano])` - Diretrizes e protocolos
- `([edição]ª edição, [ano])` - Livros
- `- [Nome] - [Org] ([ano]) ([site.com])` - Diretrizes formatadas
- `Diretriz [Nome] ([ano])` - Diretrizes mencionadas
- `Protocolo [Nome] ([ano])` - Protocolos mencionados
- `Guideline [Nome] ([ano])` - Guidelines mencionadas

**Marcadores de diretrizes/protocolos:**
- "Diretriz", "Guideline", "Protocolo", "PCDT"
- Nomes de sociedades médicas (SBC, SBD, SBPT, etc.)
- Nomes de organizações (AHA, ACC, ESC, MS, etc.)

### Mapeamento de Especialidade para Domínios

**Identificar especialidade do resumo:**
- Extrair do caminho: `resumos/[especialidade]/[tema].md`
- Identificar por conteúdo (temas cardiológicos, endocrinológicos, etc.)

**Mapeamento especialidade → domínios prioritários:**

| Especialidade | Domínios Primários (BR) | Domínios Secundários (INT) |
|---------------|------------------------|---------------------------|
| Cardiologia | diretrizes.cardiol.br | heart.org, acc.org, escardio.org |
| Endocrinologia | diabetes.org.br | diabetes.org, easd.org |
| Pneumologia | sbpt.org.br | chestnet.org, ersnet.org |
| Nefrologia | sbn.org.br | - |
| Emergências | - | heart.org (RCP), cdc.gov |
| Geral | saude.gov.br | - |

**Estratégia de busca:**
1. Priorizar domínio brasileiro se especialidade mapeada
2. Usar domínio internacional como complemento
3. Para protocolos MS: sempre `saude.gov.br`
4. Para epidemiologia: `saude.gov.br` (BR) ou `cdc.gov` (INT)

## Metodologia de Busca em Fontes Confiáveis

### Guardrails Obrigatórios

**SEMPRE seguir:**
- `.cursor/rules/guardrail-fontes-web.md`: Usar apenas whitelist de domínios
- `.cursor/rules/guardrail-versao-fontes.md`: Incluir ano/edição em todas as citações

**Validação antes de buscar:**
1. Identificar domínio apropriado da whitelist
2. Validar que domínio está autorizado
3. Adicionar `site:[domínio]` à query
4. Executar busca apenas se válida

### Estratégia de Busca por Tipo de Informação

**1. Diretrizes e Guidelines:**

**Identificar:**
- Nome da diretriz (ex: "Diretriz Brasileira de Hipertensão Arterial")
- Organização (ex: SBC)
- Ano atual citado (ex: 2020)

**Buscar:**
```python
# Exemplo de query
query = f"[tema] diretriz {ano_atual+1} {ano_atual+2} {organizacao} site:{dominio}"
```

**Ferramenta:** `mcp_Firecrawl_Web_Search_firecrawl_search` (scraping completo)

**Comparar:**
- Se ano encontrado > ano citado → atualização disponível
- Extrair conteúdo relevante da diretriz

**2. Protocolos Clínicos (PCDT):**

**Identificar:**
- Nome do protocolo (ex: "Protocolo Clínico de Diabetes")
- Órgão (ex: Ministério da Saúde)
- Ano atual citado

**Buscar:**
```python
query = f"[tema] protocolo clínico PCDT {ano_atual+1} {ano_atual+2} site:saude.gov.br"
```

**Ferramenta:** `mcp_Firecrawl_Web_Search_firecrawl_search`

**3. Dados Epidemiológicos:**

**Identificar:**
- Tipo de dado (prevalência, incidência)
- Fonte atual (ex: Vigitel)
- Ano atual dos dados

**Buscar:**
```python
query = f"[tema] prevalência {ano_atual+1} {ano_atual+2} Vigitel site:saude.gov.br"
```

**Ferramenta:** `web_search` (rápido) ou `firecrawl_search` (se relatório completo)

**4. Critérios Diagnósticos e Classificações:**

**Identificar:**
- Nome da classificação/escala (ex: "Classificação de Wagner", "Critérios de Framingham")
- Ano da fonte atual

**Buscar:**
- Verificar se há atualização na diretriz mais recente do tema
- Buscar diretriz específica que contém os critérios

**5. Tratamentos Farmacológicos:**

**Identificar:**
- Medicações mencionadas
- Doses citadas
- Ano da diretriz que estabelece o protocolo

**Buscar:**
- Buscar diretriz mais recente do tema
- Verificar se há mudanças em:
  - Doses recomendadas
  - Escalonamento terapêutico
  - Novas medicações aprovadas
  - Contraindicações atualizadas

### Ordem de Prioridade de Busca

**1. Máxima prioridade (buscar primeiro):**
- Diretrizes principais do tema (ex: Diretriz SBC de Hipertensão)
- Protocolos clínicos oficiais (PCDT)

**2. Alta prioridade:**
- Guidelines internacionais (AHA, ESC, ADA)
- Dados epidemiológicos recentes

**3. Média prioridade:**
- Atualizações em classificações
- Novas medicações aprovadas

**4. Baixa prioridade:**
- Critérios diagnósticos (só se fonte >5 anos)

## Processo de Atualização

### Passo 1: Análise do Resumo

**Leitura e extração:**
1. Ler arquivo completo do resumo
2. Identificar todas as citações de fontes com padrões reconhecidos
3. Extrair:
   - Ano de cada citação
   - Tipo de fonte (diretriz, protocolo, livro, etc.)
   - Organização/instituição
   - Seção onde está citada

**Mapeamento:**
1. Identificar especialidade do tema
2. Mapear para domínios apropriados da whitelist
3. Listar todas as fontes temporais encontradas

### Passo 2: Identificação de Oportunidades

**Classificar fontes por prioridade:**

**Prioridade 1 - Atualização obrigatória:**
- Diretrizes/Guidelines citadas (sempre verificar versão mais recente)
- Protocolos clínicos (PCDT)

**Prioridade 2 - Atualização recomendada:**
- Tratamentos com fonte >2 anos
- Epidemiologia com dados >3 anos

**Prioridade 3 - Verificação opcional:**
- Critérios diagnósticos com fonte >5 anos
- Classificações antigas (verificar se foram atualizadas)

**Ordenar:**
1. Por prioridade (1 > 2 > 3)
2. Por ano (mais antigas primeiro)
3. Por relevância clínica (protocolos > dados > classificações)

### Passo 3: Busca de Atualizações

**Para cada fonte identificada:**

1. **Construir query apropriada:**
   - Incluir tema, tipo de fonte, anos recentes
   - Adicionar `site:[domínio]` da whitelist
   - Validar query antes de executar

2. **Executar busca:**
   - Usar `firecrawl_search` para diretrizes/protocolos completos
   - Usar `web_search` para validação rápida ou dados epidemiológicos

3. **Extrair informação:**
   - Identificar ano da versão mais recente encontrada
   - Comparar com ano citado no resumo
   - Se mais recente, extrair conteúdo relevante

4. **Validar:**
   - Confirmar que é fonte confiável (whitelist)
   - Verificar que ano/edição está presente
   - Garantir que conteúdo é relevante ao tema

### Passo 4: Análise de Mudanças

**Comparar conteúdo:**

**Para diretrizes/protocolos:**
- Identificar mudanças em:
  - Novos algoritmos de tratamento
  - Mudanças em doses recomendadas
  - Novas medicações incluídas
  - Mudanças em contraindicações
  - Atualizações em metas terapêuticas

**Para epidemiologia:**
- Comparar valores (prevalência, incidência)
- Identificar tendências (aumento/diminuição)
- Atualizar números e percentuais

**Para critérios diagnósticos:**
- Verificar se critérios foram modificados
- Identificar novos critérios adicionados
- Verificar se há nova classificação

**Identificar mudanças significativas:**
- ⚠️ **Críticas**: Mudanças que alteram conduta clínica (novas medicações, mudanças de dose)
- ⚠️ **Importantes**: Atualizações em protocolos, novos critérios
- ℹ️ **Menores**: Atualizações em dados, pequenos ajustes

### Passo 5: Atualização do Arquivo

**Preservar estrutura:**
- Manter todos os cabeçalhos (##, ###)
- Preservar formatação markdown
- Manter listas e tabelas existentes
- Preservar exemplos práticos e casos

**Atualizar conteúdo:**

**Seções de Tratamento:**
- Atualizar protocolos de tratamento com nova diretriz
- Atualizar doses se houver mudanças
- Adicionar novas medicações aprovadas
- Atualizar contraindicações

**Seções de Epidemiologia:**
- Atualizar números e percentuais
- Atualizar ano dos dados
- Manter contexto e explicações

**Seções de Classificação/Critérios:**
- Atualizar apenas se houver mudança confirmada
- Preservar explicações e contexto
- Adicionar nota se classificação foi atualizada

**Seções "Fontes e Versões":**
- Atualizar TODAS as citações com novos anos
- Manter formato: `[Nome] - [Org] ([ano]) ([site.com])`
- Atualizar "Última atualização consultada"

**Preservar:**
- Fisiopatologia (não alterar)
- Semiologia (não alterar)
- Exemplos práticos (não alterar)
- Fluxogramas de raciocínio (a menos que protocolo específico mude)
- Checklists (a menos que critério específico mude)

### Passo 6: Validação

**Verificações obrigatórias:**

1. **Guardrails:**
   - ✅ Todas as fontes usadas estão na whitelist?
   - ✅ Todas as citações têm ano/edição explícito?
   - ✅ Seções "Fontes e Versões" foram atualizadas?

2. **Conteúdo:**
   - ✅ Mudanças aplicadas corretamente?
   - ✅ Estrutura preservada?
   - ✅ Formatação mantida?
   - ✅ Informações atemporais não foram alteradas?

3. **Consistência:**
   - ✅ Citações atualizadas em todas as seções relevantes?
   - ✅ Não há conflito entre seções?
   - ✅ Todas as atualizações foram aplicadas?

## Relatório de Mudanças

### Formato Obrigatório

Após atualização, gerar relatório estruturado:

```
✓ Resumo atualizado: resumos/[especialidade]/[tema].md

📊 ANÁLISE REALIZADA:
- Fontes temporais identificadas: [número]
- Oportunidades de atualização: [número]
- Buscas realizadas: [número]

🔄 ATUALIZAÇÕES REALIZADAS:

[Prioridade 1 - Críticas]
- ⚠️ Protocolo de Tratamento:
  • Diretriz SBC 2020 → Diretriz SBC 2024
  • Mudanças: [descrição das mudanças significativas]
  
- ⚠️ [Outra atualização crítica]

[Prioridade 2 - Importantes]
- 📈 Epidemiologia:
  • Dados 2021 → Dados 2024 (Vigitel)
  • Prevalência atualizada: [valor antigo] → [valor novo]

[Prioridade 3 - Menores]
- ℹ️ Classificação: Mantida (sem atualização disponível)

📚 FONTES CONSULTADAS:
- Diretriz Brasileira de [tema] - SBC (2024) (diretrizes.cardiol.br)
- Vigitel Brasil - Ministério da Saúde (2024) (saude.gov.br)
- [Outras fontes consultadas]

📝 SEÇÕES ATUALIZADAS:
- Tratamento (linhas X-Y)
- Epidemiologia (linhas A-B)
- Fontes e Versões (linhas C-D)

✅ VALIDAÇÃO:
- Guardrails respeitados: ✓
- Estrutura preservada: ✓
- Informações atemporais preservadas: ✓
```

### Classificação de Mudanças no Relatório

**Críticas (⚠️):**
- Mudanças que alteram conduta clínica diretamente
- Novas medicações aprovadas
- Mudanças significativas em doses
- Mudanças em contraindicações importantes

**Importantes (📈):**
- Atualizações em protocolos
- Novos critérios diagnósticos
- Atualizações em dados epidemiológicos
- Mudanças em metas terapêuticas

**Menores (ℹ️):**
- Pequenos ajustes em classificação
- Atualizações de citações sem mudança de conteúdo
- Dados mantidos (já atualizados)

## Tratamento de Erros e Casos Especiais

### Arquivo não encontrado

**Ação:**
- Verificar se caminho está correto
- Verificar se arquivo existe em `resumos/[especialidade]/[tema].md`
- Sugerir arquivos similares se houver

**Mensagem:**
```
❌ Erro: Arquivo não encontrado
Caminho procurado: resumos/[especialidade]/[tema].md

Arquivos similares encontrados:
- resumos/[especialidade]/[tema-similar].md
```

### Nenhuma atualização encontrada

**Ação:**
- Informar que resumo já está atualizado
- Listar versões consultadas
- Confirmar que buscas foram realizadas

**Mensagem:**
```
ℹ️ Nenhuma atualização disponível

Resumo já está atualizado com as versões mais recentes:
- Diretriz [Nome] - [Org] ([ano atual]) ([site])
- [Outras fontes consultadas]

Versões mais recentes verificadas:
- [Lista de versões verificadas]
```

### Erro ao buscar atualização

**Ação:**
- Continuar com outras atualizações
- Reportar erro específico no relatório
- Tentar fonte alternativa se disponível

**Mensagem:**
```
⚠️ Erro ao buscar atualização de [fonte]:
- Erro: [descrição do erro]
- Ação: Continuando com outras atualizações
```

### Fonte não encontrada na whitelist

**Ação:**
- Não buscar em fonte não autorizada
- Informar no relatório
- Sugerir fonte alternativa da whitelist

**Mensagem:**
```
❌ Erro: Fonte não autorizada
- Fonte tentada: [domínio]
- Solução: Usar fonte alternativa da whitelist
- Fontes disponíveis: [lista de fontes permitidas]
```

### Conflito entre fontes

**Ação:**
- Priorizar fonte mais recente
- Mencionar ambas as fontes no relatório
- Explicar escolha

**Mensagem:**
```
⚠️ Conflito entre fontes detectado:
- Fonte A: [nome] ([ano])
- Fonte B: [nome] ([ano])
- Escolha: Fonte A (mais recente)
- Justificativa: [razão]
```

## Integração com Outras Regras

### Guardrail de Fontes Web

**Seguir rigorosamente:**
- Usar apenas domínios da whitelist em `.cursor/rules/guardrail-fontes-web.md`
- Validar todos os domínios antes de buscar
- Incluir `site:[domínio]` em todas as queries

### Guardrail de Versão de Fontes

**Seguir rigorosamente:**
- Sempre incluir ano/edição em citações atualizadas
- Formato: `[Nome] - [Org] ([ano]) ([site.com])`
- Incluir seção "Fontes e Versões" atualizada
- Priorizar fontes <2 anos para informações temporais

### Regra de Resumo Médico Estruturado

**Respeitar:**
- Estrutura definida em `.cursor/rules/resumo-medico-estruturado`
- Não alterar seções obrigatórias
- Manter formato de citações estabelecido

## Limitações e Considerações

### Limitações conhecidas

1. **Busca pode não encontrar atualização:**
   - Diretriz ainda em desenvolvimento
   - Fonte não indexada pelos buscadores
   - Mudança de URL ou estrutura do site

2. **Conteúdo pode não ser extraído corretamente:**
   - PDFs complexos
   - Sites com estrutura dinâmica
   - Conteúdo protegido

3. **Análise de mudanças pode ser limitada:**
   - Mudanças sutis podem não ser detectadas
   - Comparação automática tem limitações
   - Necessária revisão manual para mudanças complexas

### Boas práticas

1. **Sempre validar mudanças críticas manualmente:**
   - Novas medicações
   - Mudanças significativas em doses
   - Novas contraindicações

2. **Preservar contexto clínico:**
   - Não apenas atualizar números
   - Manter explicações e justificativas
   - Preservar raciocínio clínico

3. **Documentar mudanças:**
   - Relatório detalhado de todas as atualizações
   - Justificar escolhas quando há conflito
   - Alertar sobre mudanças significativas

## Referências

- `.cursor/rules/guardrail-fontes-web.md` - Validação de fontes confiáveis
- `.cursor/rules/guardrail-versao-fontes.md` - Formato de citações com ano/edição
- `.cursor/commands/resumo.md` - Estratégia de busca em fontes externas
- `.cursor/commands/resumo-conciso.md` - Metodologia de resumos

