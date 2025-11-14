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

Consulte a documentação completa em `docs/`:

### Documentação Técnica

- **Arquitetura**: Stack tecnológico, estrutura de dados, integrações HL7/FHIR
- **IA e Machine Learning**: Modelos de priorização, agente WhatsApp, RAG
- **Desenvolvimento**: Setup, comandos úteis, templates e exemplos
- **Navegação Oncológica**: Implementação, regras por tipo de câncer, protocolos

### Documentação de Produto

- **Product Discovery**: Pesquisas, personas, jobs-to-be-done
- **MVP Scope**: Features do MVP, roadmap
- **Pitch Deck**: Apresentação para investidores
- **Compliance**: Checklist LGPD, ANVISA, segurança

### Guias de Desenvolvimento

- **Regras de Desenvolvimento**: `.cursor/rules/desenvolvimento-modular.mdc`
- **Padrões Frontend**: `.cursor/rules/frontend-padroes.mdc`
- **Padrões Backend**: `.cursor/rules/backend-padroes.mdc`
- **Navegação Oncológica**: `.cursor/rules/navegacao-oncologica.mdc`

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

**Documentação completa:**

- [Estado Atual e Próximos Passos](docs/desenvolvimento/estado-atual-proximos-passos.md) ⭐ **COMEÇE AQUI**
- [Setup de Configuração](docs/desenvolvimento/setup-configuracao.md)
- [Comandos Úteis](docs/desenvolvimento/comandos-uteis.md)
- [Navegação Oncológica - Implementação](docs/desenvolvimento/navegacao-oncologica-implementacao.md)
- [Navegação Oncológica - Câncer Colorretal](docs/desenvolvimento/navegacao-oncologica-colorretal.md)
- [Regras Gerais de Desenvolvimento](.cursor/rules/desenvolvimento-modular.mdc)
- [Padrões Frontend (Next.js)](.cursor/rules/frontend-padroes.mdc)
- [Padrões Backend (NestJS)](.cursor/rules/backend-padroes.mdc)
- [Atualizações em Tempo Real (WebSocket)](docs/arquitetura/realtime-updates.md)

## 🔗 Links Úteis

- **Repositório GitHub**: [github.com/luizfiorimr/OncoSaas](https://github.com/luizfiorimr/OncoSaas)
- **Documentação Completa**: Ver pasta `docs/`

## 📝 Licença

Proprietário - Todos os direitos reservados
