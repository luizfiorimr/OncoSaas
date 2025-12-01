# OncoSaas - Plataforma de Navegação Oncológica

SaaS multi-tenant para navegação oncológica com agente de IA conversacional no WhatsApp, priorização inteligente de casos, sistema de alertas e dashboard para equipe de enfermagem.

[![GitHub](https://img.shields.io/badge/GitHub-OncoSaas-blue)](https://github.com/luizfiorimr/OncoSaas)

## 🚀 Status do Projeto

- ✅ Estrutura inicial do projeto criada
- ✅ Stack tecnológico definido (Next.js, NestJS, FastAPI)
- ✅ Documentação completa criada
- ✅ Setup de desenvolvimento configurado
- ✅ **Sistema de Navegação Oncológica** implementado (câncer colorretal)
- ✅ **Sistema de Alertas** automáticos para atrasos e etapas pendentes
- ✅ **Dashboard para Enfermagem** com visualização de pacientes e priorização
- ✅ **Agente de IA WhatsApp** estruturado para conversação com pacientes
- ✅ **Modelos de Priorização** (XGBoost) para classificação de urgência
- ✅ **Integração FHIR/HL7** para interoperabilidade
- ⏳ Em desenvolvimento ativo

## 📋 Funcionalidades Principais

### 🧭 Navegação Oncológica

- Coordenação completa da jornada do paciente (rastreio → diagnóstico → tratamento → seguimento)
- Etapas automáticas baseadas no tipo de câncer
- Detecção de atrasos e alertas proativos
- Suporte para múltiplos tipos de câncer (colorretal, mama, pulmão, próstata, etc.)

### 🤖 Agente de IA WhatsApp

- Conversação natural com pacientes via WhatsApp Business API
- Triagem inicial e coleta de informações
- Orientação sobre exames e procedimentos
- Integração com sistema de navegação oncológica

### 📊 Dashboard e Priorização

- Visualização consolidada de todos os pacientes
- Priorização inteligente baseada em IA (XGBoost)
- Alertas em tempo real via WebSocket
- Filtros e buscas avançadas

### 🚨 Sistema de Alertas

- Alertas automáticos para etapas atrasadas
- Notificações de exames pendentes
- Alertas de estadiamento incompleto
- Avisos de atraso no tratamento

## Estrutura do Projeto

```
OncoSaas/
├── frontend/              # Next.js 14 (React + TypeScript)
├── backend/               # NestJS (Node.js + TypeScript)
├── ai-service/            # Python FastAPI (IA/ML)
├── docs/                  # Documentação completa
└── docker-compose.yml     # Ambiente de desenvolvimento
```

## Stack Tecnológico

- **Frontend**: Next.js 14 (React + TypeScript)
- **Backend**: NestJS (Node.js + TypeScript)
- **IA/ML**: Python (FastAPI), GPT-4/Claude, XGBoost
- **Database**: PostgreSQL (multi-tenant)
- **WhatsApp**: WhatsApp Business API
- **Integração**: HL7/FHIR

## 📚 Documentação

**[📖 Índice Completo da Documentação](docs/INDEX.md)** ⭐ **COMECE AQUI**

**[📊 Visão Geral da Documentação](docs/DOCUMENTATION_OVERVIEW.md)** - Status e resumo de toda documentação

### 📖 Documentos Essenciais

#### Para Desenvolvedores

1. **[🏗️ Arquitetura do Sistema](docs/ARCHITECTURE.md)**
   - Componentes principais (Frontend, Backend, AI Service, Database)
   - Fluxo de dados entre componentes
   - Multi-tenancy (schema por tenant)
   - Decisões de design

2. **[📡 Referência da API](docs/API_REFERENCE.md)**
   - Todos os endpoints REST
   - Eventos WebSocket
   - Autenticação e autorização
   - Exemplos de payloads

3. **[🔧 Solução de Problemas](docs/TROUBLESHOOTING.md)**
   - Erros comuns e soluções
   - Debugging de API, WebSocket, banco de dados
   - Performance e otimização

4. **[🚀 Guia de Deployment](docs/DEPLOYMENT.md)**
   - Deploy em produção (Vercel, Railway, AWS)
   - CI/CD com GitHub Actions
   - Monitoramento e logs
   - Backup e restore

5. **[🔒 Segurança](docs/SECURITY.md)**
   - Arquitetura de segurança (4 camadas)
   - Autenticação JWT e RBAC
   - Criptografia e proteção de dados
   - Compliance (LGPD, HIPAA)

6. **[🤝 Como Contribuir](CONTRIBUTING.md)**
   - Workflow de desenvolvimento
   - Padrões de código
   - Processo de code review
   - Testes

#### Para Product Managers

- **[Product Discovery](docs/product-discovery/)** - Pesquisas, personas, jobs-to-be-done
- **[Navegação Oncológica](docs/desenvolvimento/navegacao-oncologica-colorretal.md)** - Protocolos clínicos
- **[Dashboard de Enfermagem](docs/dashboard-enfermagem/)** - Interface e funcionalidades
- **[Sistema de Alertas](docs/sistema-alertas/)** - Tipos de alertas e priorização

#### Para DevOps/Infra

- **[Deployment](docs/DEPLOYMENT.md)** - Infraestrutura completa
- **[Arquitetura](docs/ARCHITECTURE.md)** - Componentes e dependências
- **[Banco de Dados](docs/banco-dados/)** - Schema, queries, backup

### 🗂️ Documentação por Categoria

- **🏗️ Arquitetura**: Stack, estrutura de dados, integrações HL7/FHIR
- **💻 Desenvolvimento**: Setup, comandos, navegação oncológica, estrutura de projetos
- **🗄️ Banco de Dados**: Modelo de dados, schema Prisma, queries, performance
- **🚨 Alertas**: Arquitetura, tipos, priorização
- **🤖 IA/ML**: Modelo de priorização, agente WhatsApp, RAG
- **📊 Dashboard**: Requisitos, funcionalidades, wireframes
- **📈 Product**: Canvas, personas, jobs-to-be-done
- **⚖️ Compliance**: LGPD, ANVISA, CFM telemedicina

### 📋 Guias de Desenvolvimento

- **[Regras Gerais](.cursor/rules/desenvolvimento-modular.mdc)** - Modularidade, multi-tenancy, boas práticas
- **[Padrões Frontend](.cursor/rules/frontend-padroes.mdc)** - Next.js 14, React, TypeScript
- **[Padrões Backend](.cursor/rules/backend-padroes.mdc)** - NestJS, Prisma, WebSocket
- **[Navegação Oncológica](.cursor/rules/navegacao-oncologica.mdc)** - Raciocínio clínico, protocolos

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Docker e Docker Compose

### Setup Inicial

```bash
# 1. Instalar dependências
npm install
cd backend && npm install
cd ai-service && pip install -r requirements.txt

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# 3. Configurar Husky (Git hooks)
npm run prepare

# 4. Iniciar ambiente de desenvolvimento
docker-compose up -d
npm run dev
```

### Ferramentas de Qualidade

O projeto inclui configuração completa de:

- ✅ **ESLint**: Linter para TypeScript/JavaScript
- ✅ **Prettier**: Formatador automático de código
- ✅ **Jest**: Framework de testes (Backend)
- ✅ **Husky**: Git hooks (validação antes de commit/push)
- ✅ **lint-staged**: Lint apenas arquivos modificados

**Comandos principais:**

```bash
# Lint
npm run lint              # Frontend
cd backend && npm run lint # Backend

# Formatação
npm run format            # Formatar tudo
npm run format:check      # Verificar sem modificar

# Testes
cd backend && npm test    # Rodar testes
cd backend && npm run test:cov # Com cobertura
```

**Primeiros passos:**

1. **[Estado Atual e Próximos Passos](docs/desenvolvimento/estado-atual-proximos-passos.md)** ⭐ **COMEÇE AQUI**
2. **[Setup de Desenvolvimento](docs/desenvolvimento/setup-desenvolvimento.md)** - Configuração completa
3. **[Arquitetura](docs/ARCHITECTURE.md)** - Entender como o sistema funciona
4. **[API Reference](docs/API_REFERENCE.md)** - Conhecer todos os endpoints

## 🔗 Links Úteis

- **Repositório GitHub**: [github.com/luizfiorimr/OncoSaas](https://github.com/luizfiorimr/OncoSaas)
- **Documentação Completa**: Ver pasta `docs/`

## 📝 Licença

Proprietário - Todos os direitos reservados
