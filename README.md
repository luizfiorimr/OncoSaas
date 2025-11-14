# Plataforma de Otimização de Processos Oncológicos

SaaS multi-tenant para otimização de processos oncológicos com agente de IA conversacional no WhatsApp, priorização inteligente de casos e dashboard para equipe de enfermagem.

## 🚀 Status do Projeto

- ✅ Estrutura inicial do projeto criada
- ✅ Stack tecnológico definido (Next.js, NestJS, FastAPI)
- ✅ Documentação completa criada
- ✅ Setup de desenvolvimento configurado
- ✅ Modelos de IA e agente WhatsApp estruturados
- ⏳ Em desenvolvimento ativo

## Estrutura do Projeto

```
MEDSAAS/
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

## Documentação

Consulte a documentação completa em `docs/`:

- Product Discovery
- Arquitetura Técnica
- IA e Machine Learning
- Chat
- Compliance e Legal
- MVP Scope
- Pitch Deck
- **Desenvolvimento**: Regras de modularidade e boas práticas (`.cursor/rules/desenvolvimento-modular.mdc`)
- **Templates**: Exemplos práticos de código (`docs/desenvolvimento/templates-e-exemplos.md`)

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
- [Regras Gerais de Desenvolvimento](.cursor/rules/desenvolvimento-modular.mdc)
- [Padrões Frontend (Next.js)](.cursor/rules/frontend-padroes.mdc)
- [Padrões Backend (NestJS)](.cursor/rules/backend-padroes.mdc)
- [Atualizações em Tempo Real (WebSocket)](docs/arquitetura/realtime-updates.md)

## Licença

Proprietário - Todos os direitos reservados
