# 🚀 Guia Completo de Desenvolvimento

Este guia fornece uma visão abrangente de como desenvolver no OncoSaas, desde a configuração inicial até o deployment.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
6. [Padrões de Código](#padrões-de-código)
7. [Testes](#testes)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

## 📦 Pré-requisitos

### Software Necessário

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/))
- **Docker** e **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

### Ferramentas Recomendadas

- **VS Code** com extensões:
  - ESLint
  - Prettier
  - Prisma
  - Python
  - Docker
- **Postman** ou **Insomnia** (para testar APIs)
- **DBeaver** ou **pgAdmin** (para gerenciar banco de dados)

## 🔧 Instalação

### 1. Clonar Repositório

```bash
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas
```

### 2. Instalar Dependências

```bash
# Dependências do projeto raiz
npm install

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..

# AI Service
cd ai-service
pip install -r requirements.txt
cd ..
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas configurações
# Veja: docs/desenvolvimento/setup-configuracao.md
```

### 4. Iniciar Serviços com Docker

```bash
# Iniciar PostgreSQL, Redis e RabbitMQ
docker-compose up -d

# Verificar se estão rodando
docker-compose ps
```

### 5. Configurar Banco de Dados

```bash
# Gerar Prisma Client
cd backend
npm run prisma:generate

# Executar migrations
npm run prisma:migrate

# (Opcional) Popular com dados de teste
npm run prisma:seed
```

### 6. Iniciar Aplicação

```bash
# Na raiz do projeto
npm run dev

# Ou iniciar serviços separadamente:
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Backend
cd backend && npm run start:dev

# Terminal 3 - AI Service
cd ai-service && uvicorn main:app --reload --port 8001
```

## ⚙️ Configuração

### Variáveis de Ambiente Essenciais

Consulte [Setup de Configuração](setup-configuracao.md) para detalhes completos.

**Mínimas necessárias para desenvolvimento:**

```env
# Database
DATABASE_URL=postgresql://medsaas:medsaas_dev@localhost:5433/medsaas_development

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_WS_URL=ws://localhost:3002

# AI Service
AI_SERVICE_URL=http://localhost:8001
```

### Configuração de HTTPS Local

Para desenvolvimento com HTTPS (necessário para WhatsApp OAuth):

```bash
# Gerar certificados SSL
npm run generate-certs

# Iniciar com HTTPS
npm run dev:https
```

Veja [HTTPS Setup](https-setup.md) para detalhes.

## 📁 Estrutura do Projeto

```
OncoSaas/
├── frontend/              # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/          # Rotas (App Router)
│   │   ├── components/   # Componentes React
│   │   ├── lib/          # Utilitários e API clients
│   │   ├── hooks/        # Custom hooks
│   │   └── stores/       # Zustand stores
│   └── public/           # Arquivos estáticos
│
├── backend/               # NestJS
│   ├── src/
│   │   ├── modules/      # Módulos por feature
│   │   │   ├── patients/
│   │   │   ├── alerts/
│   │   │   ├── conversations/
│   │   │   └── ...
│   │   ├── common/       # Código compartilhado
│   │   └── prisma/       # Prisma service
│   └── prisma/
│       ├── schema.prisma # Schema do banco
│       └── migrations/   # Migrations
│
├── ai-service/           # FastAPI (Python)
│   ├── src/
│   │   ├── api/         # Rotas FastAPI
│   │   ├── models/      # Modelos ML
│   │   ├── agent/       # Agente WhatsApp
│   │   └── services/    # Serviços auxiliares
│   └── requirements.txt
│
├── docs/                 # Documentação
├── scripts/              # Scripts utilitários
└── docker-compose.yml    # Serviços Docker
```

## 🔄 Fluxo de Desenvolvimento

### 1. Criar Nova Feature

```bash
# 1. Criar branch
git checkout -b feature/nome-da-feature

# 2. Desenvolver feature
# - Backend: Criar módulo em backend/src/modules/
# - Frontend: Criar componentes em frontend/src/
# - AI Service: Adicionar endpoints em ai-service/src/api/

# 3. Testar localmente
npm run dev

# 4. Commitar
git add .
git commit -m "feat: adiciona nova feature"

# 5. Push e criar PR
git push origin feature/nome-da-feature
```

### 2. Padrão de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona funcionalidade
fix: corrige bug
docs: atualiza documentação
refactor: refatora código
test: adiciona testes
chore: tarefas de manutenção
```

### 3. Code Review

- Todos os PRs precisam de aprovação
- Verificar lint e testes antes de merge
- Manter histórico de commits limpo

## 📝 Padrões de Código

### TypeScript

- Sempre usar tipos explícitos
- Evitar `any`
- Usar interfaces para contratos
- Validar dados de entrada com Zod (frontend) ou class-validator (backend)

### Backend (NestJS)

- Um módulo por feature
- Services contêm lógica de negócio
- Controllers apenas roteamento
- Sempre incluir `tenantId` em queries
- Usar DTOs para validação

Veja [Padrões Backend](.cursor/rules/backend-padroes.mdc) para detalhes.

### Frontend (Next.js)

- Server Components por padrão
- Client Components apenas quando necessário
- Usar React Query para dados do servidor
- Componentes pequenos e focados

Veja [Padrões Frontend](.cursor/rules/frontend-padroes.mdc) para detalhes.

### Python (AI Service)

- Type hints obrigatórios
- Schemas Pydantic para validação
- Async/await para operações I/O
- Docstrings para funções públicas

## 🧪 Testes

### Backend

```bash
cd backend

# Rodar todos os testes
npm test

# Testes com cobertura
npm run test:cov

# Testes em modo watch
npm run test:watch
```

### Frontend

```bash
cd frontend

# Rodar testes
npm test

# Testes E2E (quando configurado)
npm run test:e2e
```

### AI Service

```bash
cd ai-service

# Rodar testes pytest
pytest

# Com cobertura
pytest --cov=src
```

## 🚀 Deployment

### Ambiente de Desenvolvimento

```bash
# Usar docker-compose
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Ambiente de Produção

1. **Build das aplicações**
   ```bash
   npm run build
   ```

2. **Configurar variáveis de ambiente de produção**

3. **Executar migrations**
   ```bash
   cd backend
   npm run prisma:migrate deploy
   ```

4. **Iniciar serviços**
   ```bash
   npm start
   ```

Veja documentação específica de deployment para mais detalhes.

## 🔍 Troubleshooting

### Problemas Comuns

#### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Ver logs
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

#### Prisma Client desatualizado
```bash
cd backend
npm run prisma:generate
```

#### Porta já em uso
```bash
# Verificar processos
lsof -i :3000  # Frontend
lsof -i :3002  # Backend
lsof -i :8001  # AI Service

# Matar processo
kill -9 <PID>
```

#### Dependências desatualizadas
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Logs e Debug

```bash
# Backend logs
cd backend && npm run start:dev

# Frontend logs
cd frontend && npm run dev

# Docker logs
docker-compose logs -f

# Prisma Studio (visualizar banco)
cd backend && npm run prisma:studio
```

## 📚 Recursos Adicionais

- [Comandos Úteis](comandos-uteis.md) - Referência rápida
- [Templates e Exemplos](templates-e-exemplos.md) - Código de referência
- [Estado Atual](estado-atual-proximos-passos.md) - O que está implementado
- [Regras de Desenvolvimento](.cursor/rules/desenvolvimento-modular.mdc) - Padrões gerais

## 🤝 Contribuindo

1. Leia as [Regras de Desenvolvimento](.cursor/rules/desenvolvimento-modular.mdc)
2. Siga os padrões de código
3. Escreva testes
4. Atualize documentação
5. Crie PRs descritivos

---

**Última atualização**: 2024-01-XX
