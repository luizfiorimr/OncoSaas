# 📚 Visão Geral da Documentação - OncoSaas

Este documento fornece uma visão geral completa de toda a documentação do projeto OncoSaas.

## 📊 Status da Documentação

✅ **Documentação Completa e Atualizada** (Dezembro 2024)

### Estatísticas

- **Documentos Principais**: 6 arquivos essenciais
- **Guias de Desenvolvimento**: 15+ documentos específicos
- **Documentos Técnicos**: 20+ arquivos técnicos detalhados
- **Total de Páginas**: ~150+ páginas de documentação

---

## 📑 Documentos Principais

### 1. [INDEX.md](INDEX.md) ⭐ **COMECE AQUI**
**O que é:** Índice completo de toda a documentação do projeto.

**Quando usar:**
- Você é novo no projeto
- Está procurando documentação específica
- Quer entender a estrutura da documentação

**Conteúdo:**
- Início rápido (setup, primeiros passos)
- Documentação por categoria (arquitetura, desenvolvimento, banco de dados, etc.)
- Guias por persona (novo desenvolvedor, PM, DevOps)
- Referências rápidas

---

### 2. [ARCHITECTURE.md](ARCHITECTURE.md) 🏗️
**O que é:** Arquitetura completa do sistema OncoSaas.

**Quando usar:**
- Entender como o sistema funciona
- Decisões arquiteturais
- Fluxo de dados entre componentes
- Planejamento de features

**Conteúdo:**
- Arquitetura de alto nível (diagrama)
- Componentes principais (Frontend, Backend, AI Service, Database)
- Fluxo de dados (conversas WhatsApp, priorização, alertas)
- Multi-tenancy (schema por tenant)
- Segurança (camadas de proteção)
- Escalabilidade e performance
- Decisões de design

**Principais Seções:**
```
- Componentes Principais
- Fluxo de Dados
- Multi-Tenancy
- Segurança
- Escalabilidade
- Decisões de Design
```

---

### 3. [API_REFERENCE.md](API_REFERENCE.md) 📡
**O que é:** Referência completa da API REST e WebSocket.

**Quando usar:**
- Integrar com a API
- Desenvolver frontend
- Testar endpoints
- Entender payloads

**Conteúdo:**
- Autenticação (login, refresh token, logout)
- Endpoints de Pacientes (CRUD, filtros, busca)
- Endpoints de Conversas (WhatsApp, histórico, mensagens)
- Endpoints de Navegação Oncológica (etapas, atualização)
- Endpoints de Alertas (listagem, atualização de status)
- Endpoints de Usuários (gerenciamento, roles)
- Endpoints de Métricas (dashboard, KPIs)
- WebSocket Events (alertas críticos, mensagens, priorização)

**Formato:**
```markdown
### POST /patients
**Autenticação:** JWT obrigatório
**Request Body:**
```json
{ "name": "...", "email": "..." }
```
**Response (201):**
```json
{ "data": { "id": "uuid", ... } }
```
```

---

### 4. [DEPLOYMENT.md](DEPLOYMENT.md) 🚀
**O que é:** Guia completo de deployment para todos os ambientes.

**Quando usar:**
- Deploy em produção
- Configurar staging
- Setup de CI/CD
- Configurar monitoramento
- Implementar backups

**Conteúdo:**
- Opções de deployment:
  - **Opção 1:** Vercel (Frontend) + Railway/Render (Backend)
  - **Opção 2:** AWS Completo (ECS Fargate, RDS, ElastiCache, S3/CloudFront)
  - **Opção 3:** DigitalOcean App Platform
- Variáveis de ambiente
- CI/CD com GitHub Actions
- Monitoramento (Sentry, CloudWatch, logs)
- Backup e Restore (PostgreSQL)
- Rollback procedures
- Deployment checklist

**Arquitetura AWS:**
```
Internet → CloudFront → S3 (Frontend)
        → ALB → ECS Fargate (Backend/AI)
                  ↓
              RDS PostgreSQL
              ElastiCache Redis
```

---

### 5. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) 🔧
**O que é:** Guia de solução de problemas comuns.

**Quando usar:**
- Erro durante desenvolvimento
- Problema em produção
- Performance ruim
- Debugging

**Conteúdo:**
- Problemas de Setup
- Problemas de Banco de Dados
- Problemas de API (401, 403, 500, CORS)
- Problemas de WebSocket (desconexão, reconexão)
- Problemas de Autenticação
- Problemas de Performance
- Problemas de Deployment
- Logs e Debugging

**Formato:**
```markdown
### ❌ Erro: `Cannot find module '@prisma/client'`
**Causa:** Prisma client não foi gerado.
**Solução:**
```bash
cd backend
npx prisma generate
```
**Prevenção:** Sempre rodar após modificar schema.
```

---

### 6. [SECURITY.md](SECURITY.md) 🔒
**O que é:** Guia de segurança e práticas de proteção de dados.

**Quando usar:**
- Implementar features com dados sensíveis
- Code review de segurança
- Preparar para auditoria
- Reportar vulnerabilidades

**Conteúdo:**
- Arquitetura de Segurança (4 camadas)
- Autenticação e Autorização (JWT, RBAC, MFA)
- Multi-Tenancy e Isolamento de Dados
- Criptografia (TLS 1.3, AES-256, bcrypt)
- Proteção de API (rate limiting, CORS, validação)
- Auditoria e Logging (imutável, 5 anos)
- Segurança de Dados Sensíveis (PII, PHI)
- Compliance (LGPD, HIPAA)
- Reportar Vulnerabilidades (responsible disclosure)

**Camadas de Segurança:**
```
1. Network Security (Firewall, DDoS, Rate Limiting)
2. Application Security (JWT, RBAC, Validation)
3. Data Security (Encryption, Multi-Tenancy)
4. Monitoring & Audit (Logs, Intrusion Detection)
```

---

## 📂 Documentação por Categoria

### 🏗️ Arquitetura e Design

- [Stack Tecnológico](arquitetura/stack-tecnologico.md)
- [Estrutura de Dados](arquitetura/estrutura-dados.md)
- [Multi-Tenancy](arquitetura/multi-tenancy.md)
- [Integrações (HL7/FHIR)](integracao-fhir-completa.md)

### 💻 Desenvolvimento

- [Setup de Desenvolvimento](desenvolvimento/setup-desenvolvimento.md)
- [Estado Atual e Próximos Passos](desenvolvimento/estado-atual-proximos-passos.md)
- [Navegação Oncológica Colorretal](desenvolvimento/navegacao-oncologica-colorretal.md)
- [Estrutura de Projetos](desenvolvimento/estrutura-projetos.md)

### 🗄️ Banco de Dados

- [Modelo de Dados](banco-dados/modelo-dados.md)
- [Schema Prisma](banco-dados/schema-prisma.md)
- [Queries e Performance](banco-dados/queries-performance.md)

### 🚨 Sistema de Alertas

- [Arquitetura de Alertas](sistema-alertas/arquitetura-alertas.md)
- [Tipos de Alertas](sistema-alertas/tipos-alertas.md)
- [Priorização](sistema-alertas/priorizacao.md)

### 🤖 IA e Machine Learning

- [Modelo de Priorização](ia-modelo-priorizacao/modelo-priorizacao.md)
- [Agente WhatsApp](ia-modelo-priorizacao/agente-whatsapp.md)
- [RAG (Retrieval Augmented Generation)](ia-modelo-priorizacao/rag.md)

### 📊 Dashboard de Enfermagem

- [Requisitos e Funcionalidades](dashboard-enfermagem/requisitos.md)
- [Wireframes](dashboard-enfermagem/wireframes.md)

### 📈 Product Discovery

- [Canvas e Lean Canvas](product-discovery/canvas.md)
- [Personas](product-discovery/personas.md)
- [Jobs to be Done](product-discovery/jobs-to-be-done.md)

### ⚖️ Compliance e Legal

- [LGPD](compliance-legal/lgpd.md)
- [ANVISA](compliance-legal/anvisa.md)
- [CFM Telemedicina](compliance-legal/cfm-telemedicina.md)

---

## 🎯 Guias por Persona

### 🆕 Novo Desenvolvedor

**Objetivo:** Começar a desenvolver no projeto rapidamente.

**Sequência Recomendada:**

1. **[INDEX.md](INDEX.md)** - Visão geral
2. **[Setup de Desenvolvimento](desenvolvimento/setup-desenvolvimento.md)** - Configurar ambiente
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Entender arquitetura
4. **[API_REFERENCE.md](API_REFERENCE.md)** - Conhecer endpoints
5. **[Estado Atual e Próximos Passos](desenvolvimento/estado-atual-proximos-passos.md)** - Saber onde contribuir
6. **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Como contribuir

**Tempo Estimado:** 2-3 horas

---

### 👨‍💼 Product Manager

**Objetivo:** Entender funcionalidades, roadmap e métricas.

**Sequência Recomendada:**

1. **[Product Discovery](product-discovery/)** - Entender problema e solução
2. **[Navegação Oncológica Colorretal](desenvolvimento/navegacao-oncologica-colorretal.md)** - Protocolo clínico
3. **[Dashboard de Enfermagem](dashboard-enfermagem/)** - Interface principal
4. **[Sistema de Alertas](sistema-alertas/)** - Funcionalidade crítica
5. **[Modelo de Priorização](ia-modelo-priorizacao/modelo-priorizacao.md)** - Algoritmo de IA

**Tempo Estimado:** 3-4 horas

---

### 🚀 DevOps / Infra

**Objetivo:** Configurar infraestrutura e garantir operação.

**Sequência Recomendada:**

1. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia completo de deploy
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Componentes e dependências
3. **[SECURITY.md](SECURITY.md)** - Requisitos de segurança
4. **[Banco de Dados](banco-dados/)** - Backup, restore, migrations
5. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas comuns

**Tempo Estimado:** 2-3 horas

---

### 🧪 QA / Tester

**Objetivo:** Testar funcionalidades e reportar bugs.

**Sequência Recomendada:**

1. **[Casos de Uso](casos-uso/)** - Fluxos de usuário
2. **[API_REFERENCE.md](API_REFERENCE.md)** - Endpoints para testar
3. **[Dashboard de Enfermagem](dashboard-enfermagem/)** - Interface principal
4. **[Sistema de Alertas](sistema-alertas/)** - Funcionalidade crítica
5. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Como reportar bugs

**Tempo Estimado:** 2 horas

---

## 🔍 Busca Rápida

### Por Tecnologia

- **Next.js/React:** [Frontend](desenvolvimento/), [API_REFERENCE.md](API_REFERENCE.md)
- **NestJS:** [Backend](desenvolvimento/), [ARCHITECTURE.md](ARCHITECTURE.md)
- **FastAPI/Python:** [IA e ML](ia-modelo-priorizacao/)
- **PostgreSQL:** [Banco de Dados](banco-dados/)
- **Prisma:** [Schema](banco-dados/schema-prisma.md)
- **Socket.io:** [ARCHITECTURE.md](ARCHITECTURE.md), [API_REFERENCE.md](API_REFERENCE.md)

### Por Feature

- **WhatsApp:** [Agente WhatsApp](ia-modelo-priorizacao/agente-whatsapp.md)
- **Priorização:** [Modelo de Priorização](ia-modelo-priorizacao/modelo-priorizacao.md)
- **Alertas:** [Sistema de Alertas](sistema-alertas/)
- **Navegação:** [Navegação Oncológica](desenvolvimento/navegacao-oncologica-colorretal.md)
- **Dashboard:** [Dashboard de Enfermagem](dashboard-enfermagem/)

### Por Problema

- **Erro no setup:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-setup)
- **Erro de API:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-api)
- **Performance:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-performance)
- **Deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Segurança:** [SECURITY.md](SECURITY.md)

---

## 📝 Como Contribuir com a Documentação

Veja o [Guia de Contribuição](../CONTRIBUTING.md#documentação).

### Padrões de Documentação

1. **Formato:** Markdown (`.md`)
2. **Nomenclatura:** `kebab-case.md`
3. **Estrutura:**
   - Título claro (# H1)
   - Índice para documentos longos
   - Seções bem organizadas (## H2, ### H3)
   - Código com syntax highlighting
   - Exemplos práticos
4. **Localização:** Diretório apropriado em `docs/`
5. **Índice:** Atualizar [INDEX.md](INDEX.md)

### Exemplo de Documentação

```markdown
# 🎯 Título do Documento

Breve descrição do que este documento cobre.

## 📋 Índice

- [Seção 1](#seção-1)
- [Seção 2](#seção-2)

## Seção 1

Conteúdo...

### Subseção 1.1

Mais conteúdo...

## Seção 2

```typescript
// Código de exemplo
const example = "Hello World";
```

---

**Última atualização:** DD/MM/AAAA  
**Versão:** X.Y.Z
```

---

## 🔄 Atualizações Recentes

### Dezembro 2024

- ✅ Criado [INDEX.md](INDEX.md) - Índice completo da documentação
- ✅ Criado [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura detalhada
- ✅ Criado [API_REFERENCE.md](API_REFERENCE.md) - Referência completa da API
- ✅ Criado [DEPLOYMENT.md](DEPLOYMENT.md) - Guia de deployment
- ✅ Criado [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solução de problemas
- ✅ Criado [SECURITY.md](SECURITY.md) - Guia de segurança
- ✅ Atualizado [CONTRIBUTING.md](../CONTRIBUTING.md) - Guia de contribuição expandido

---

## 📞 Contatos

- **Desenvolvimento:** dev@oncosaas.com
- **Documentação:** docs@oncosaas.com
- **Segurança:** security@oncosaas.com

---

**Última atualização:** 01/12/2024  
**Versão:** 1.0.0

✨ **Documentação completa e atualizada!**
