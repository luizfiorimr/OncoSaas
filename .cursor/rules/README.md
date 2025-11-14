# Regras do Cursor para Projeto de Livros Médicos

Este diretório contém as regras do Cursor que orientam o desenvolvimento e manutenção do projeto de conversão de livros médicos.

## Regras Disponíveis

### 🌐 projeto-medicina.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Fornece contexto geral sobre o projeto, incluindo:
- Estrutura do projeto
- Scripts disponíveis
- Lista de livros
- Dependências Python

Esta regra é carregada automaticamente em todas as interações.

---

### 🐍 python-conversao.mdc
**Tipo:** Aplicada a arquivos Python (`globs: *.py`)

Define padrões para os scripts de conversão:
- Encoding e shebang
- Nomenclatura de funções e variáveis
- Estrutura de funções
- Tratamento de erros
- Boas práticas de processamento de PDFs

Ativa automaticamente ao editar arquivos `.py`.

---

### 📁 organizacao-arquivos.mdc
**Tipo:** Sob demanda (`description`)

Regras de organização do projeto:
- Estrutura de diretórios
- Convenções de nomenclatura
- Paths importantes
- Regras de criação de arquivos

Use quando trabalhar com estrutura de arquivos ou organização.

---

### 📝 markdown-livros.mdc
**Tipo:** Aplicada a arquivos Markdown (`globs: *.md`)

Padrões para documentos Markdown dos livros:
- Estrutura de documento
- Formatação de cabeçalhos
- Inserção de imagens
- Tratamento de páginas especiais

Ativa automaticamente ao editar arquivos `.md`.

---

## Regras de Especialidades Médicas

### 👨‍⚕️ medicina-familia.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Medicina de Família e Comunidade:
- Terminologia de APS
- Protocolos: HAS, DM, saúde da mulher, criança, idoso
- Vacinação, pré-natal, puericultura
- Rastreamentos oncológicos e cardiovasculares
- Medicações essenciais na atenção primária

---

### 🩺 clinica-medica.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Clínica Médica:
- Terminologia de doenças sistêmicas
- Cardiologia: IC, FA, SCA, valvulopatias
- Pneumologia: DPOC, asma, pneumonia, derrame pleural
- Nefrologia: DRC, distúrbios hidroeletrolíticos
- Gastroenterologia: DRGE, H. pylori, hepatites, cirrose
- Endocrinologia: tireoide, diabetes, obesidade
- Hematologia: anemias, anticoagulação
- Scores: CHADS2-VASc, CURB-65, Child-Pugh

---

### ✂️ clinica-cirurgica.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Clínica Cirúrgica:
- Terminologia cirúrgica e anatomia
- Classificação ASA, índice de Lee
- Antibioticoprofilaxia cirúrgica
- Abdome agudo: apendicite, colecistite, pancreatite
- Obstrução intestinal, hérnias
- Úlcera perfurada, diverticulite
- Queimaduras (Regra dos 9)
- Complicações pós-operatórias

---

### 🚑 emergencista.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Medicina de Emergência:
- Triagem de Manchester
- Protocolos ACLS: PCR, FV/TVSP, AESP
- Protocolo ATLS: trauma, ABCDE, choque hemorrágico
- PALS: RCP pediátrica
- Emergências cardiológicas: IAM, EAP, arritmias
- Emergências neurológicas: AVC, convulsões
- Scores: Glasgow, qSOFA, FAST
- Intoxicações, queimaduras

---

### 🏥 pronto-socorro.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Medicina de Pronto Socorro/UPA:
- Diferenciação: Urgência vs Emergência
- Classificação de risco adaptada
- Urgências comuns: cólica renal, lombalgia, cefaleia
- Crise hipertensiva (urgência), crise asmática leve/moderada
- Suturas, imobilizações, curativos
- Orientações de alta e sinais de retorno
- Critérios de transferência para emergência
- Manejo ambulatorial de urgências de menor complexidade

---

### 🏥 intensivista.mdc
**Tipo:** Sempre aplicada (`alwaysApply: true`)

Conhecimento detalhado em Medicina Intensiva:
- Scores: APACHE II, SOFA, SAPS 3
- Sepse e choque séptico (pacote de 1h)
- Ventilação mecânica: estratégia protetora, SARA, desmame
- Sedação e analgesia: escala RASS, protocolos
- Vasopressores e inotrópicos
- Hemodinâmica e ressuscitação
- IRA e diálise
- Distúrbios ácido-base
- Hipertensão intracraniana
- Nutrição, delirium, bloqueio neuromuscular

---

## Regras de Resumos Médicos

### 📝 resumo-medico-estruturado.mdc
**Tipo:** Sob demanda (usado pelo comando `.resumo`)

Estrutura completa para criar resumos médicos detalhados:
- Todas as seções obrigatórias
- Profundidade máxima (~200+ páginas)
- Foco em completude acadêmica
- Inclui fisiopatologia molecular, farmacologia completa, exemplos práticos extensos

### 📄 resumo-conciso.mdc
**Tipo:** Sob demanda (usado pelo comando `.resumo-conciso`)

Estrutura para criar resumos médicos concisos (≤30 páginas):
- 15 seções obrigatórias focadas em aplicabilidade
- Equilibra profundidade com objetividade
- Orientado para tomada de decisão clínica
- Ideal para: consulta rápida, revisão pré-plantão, checklist

**Use quando:**
- Criar resumos para aplicação prática imediata
- Material para plantão ou atendimento
- Revisão focada em ação clínica

---

## Meta-Regra

### 📋 template-especialista.mdc
**Tipo:** Sob demanda (`alwaysApply: false`)

**Template e guia para criar regras de especialidades médicas.**

Esta meta-regra documenta:
- Estrutura padrão completa de regras de especialidades
- Metodologia de raciocínio clínico (7 subseções obrigatórias)
- Stack de habilidades do especialista
- Guia passo a passo de preenchimento
- Checklist de qualidade
- Princípios fundamentais
- Exemplos de referência

**Use quando:**
- Criar uma nova especialidade (ex: Cardiologia, Neurologia, Pediatria)
- Revisar/melhorar regras existentes
- Garantir consistência entre especialidades
- Validar completude de uma regra

**Baseada na análise de:** Medicina de Família, Clínica Médica, Clínica Cirúrgica, Emergencista e Intensivista

---

## Como Usar

As regras são automaticamente aplicadas pelo Cursor baseado em:
1. **alwaysApply: true** - Sempre ativa
2. **globs** - Ativa para tipos de arquivo específicos
3. **description** - Pode ser referenciada manualmente

## Manutenção

Para modificar ou adicionar regras:
1. Edite os arquivos `.mdc` existentes
2. Ou crie novos arquivos `.mdc` neste diretório
3. Use a sintaxe de frontmatter YAML para metadados
4. Referencie arquivos usando `[nome](mdc:caminho/relativo)`

## Estrutura de uma Regra

```markdown
---
alwaysApply: false
description: "Descrição da regra"
globs: *.extensao
---

# Título da Regra

Conteúdo em Markdown com instruções e exemplos...

## Referências

Use [nome do arquivo](mdc:caminho/arquivo.ext) para referenciar arquivos.
```

---

**Criado em:** 27 de outubro de 2025  
**Projeto:** Conversão de Livros Médicos para Markdown

