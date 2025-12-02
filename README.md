# 🏥 MedSaaS Oncologia - Plataforma de Navegação Oncológica

Sistema SaaS multi-tenant para otimização de processos oncológicos, incluindo navegação de pacientes, priorização inteligente via IA, integração com WhatsApp Business API e gestão completa da jornada do paciente oncológico.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação Rápida](#instalação-rápida)
- [Instalação Manual](#instalação-manual)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## 🎯 Sobre o Projeto

O MedSaaS Oncologia é uma plataforma completa para gestão e otimização de processos oncológicos, com foco em:

- **Navegação Oncológica**: Acompanhamento da jornada do paciente com etapas, prazos e alertas
- **Priorização Inteligente**: IA para classificar pacientes por criticidade
- **WhatsApp Business**: Integração via Meta OAuth para comunicação com pacientes
- **Agente Conversacional**: Chatbot com RAG para triagem e suporte
- **Multi-tenancy**: Isolamento completo de dados por hospital/clínica
- **Compliance**: LGPD, HIPAA-like, criptografia de dados sensíveis

## 🚀 Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Banco de dados relacional
- **Redis** - Cache e message broker
- **RabbitMQ** - Message queue
- **JWT** - Autenticação
- **Socket.io** - WebSocket para real-time

### Frontend
- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **Zustand** - State management
- **React Query** - Server state
- **Socket.io Client** - WebSocket client

### AI Service
- **FastAPI** - API framework Python
- **OpenAI / Anthropic** - LLMs
- **Sentence Transformers** - Embeddings
- **Scikit-learn / XGBoost** - ML models
- **Google Cloud STT** - Speech-to-Text

### Infraestrutura
- **Docker & Docker Compose** - Containerização
- **AWS S3** - Armazenamento de áudios
- **FHIR** - Integração com EHR
- **Meta WhatsApp Business API** - Comunicação

## 📦 Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/))
- **Docker** & Docker Compose ([Download](https://docs.docker.com/get-docker/))
- **Git** ([Download](https://git-scm.com/))

### Verificar instalações:

```bash
node --version    # v18.x ou superior
npm --version     # 9.x ou superior
python --version  # 3.11.x ou superior
docker --version  # 20.x ou superior
```

## ⚡ Instalação Rápida

### Linux / Mac

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/medsaas-oncologia.git
cd medsaas-oncologia

# 2. Execute o script de setup automatizado
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. Configure o arquivo .env
nano .env  # ou code .env

# 4. Inicie os serviços
npm run dev
```

### Windows

```batch
REM 1. Clone o repositório
git clone https://github.com/seu-usuario/medsaas-oncologia.git
cd medsaas-oncologia

REM 2. Execute o script de setup automatizado
scripts\setup.bat

REM 3. Configure o arquivo .env
notepad .env

REM 4. Inicie os serviços
npm run dev
```

## 🔧 Instalação Manual

<details>
<summary>Clique para expandir o passo a passo manual</summary>

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/medsaas-oncologia.git
cd medsaas-oncologia
```

### 2. Configure Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha as variáveis obrigatórias (veja comentários no arquivo).

### 3. Inicie os Serviços Docker

```bash
docker-compose up -d postgres redis rabbitmq
```

Aguarde ~10 segundos para os serviços ficarem prontos.

### 4. Configure o Backend

```bash
cd backend

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate dev --name init

# Executar seed (dados iniciais)
npm run prisma:seed

cd ..
```

### 5. Configure o Frontend

```bash
cd frontend
npm install
cd ..
```

### 6. Configure o AI Service

```bash
cd ai-service

# Criar ambiente virtual
python -m venv .venv

# Ativar ambiente virtual
# Linux/Mac:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Desativar ambiente virtual
deactivate

cd ..
```

### 7. Gerar Certificados SSL (Opcional - para HTTPS local)

```bash
npm run generate-certs
```

### 8. Validar Setup

```bash
npm run validate
```

</details>

## 📁 Estrutura do Projeto

```
medsaas-oncologia/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/     # Módulos por feature
│   │   ├── common/      # Guards, interceptors, etc.
│   │   └── prisma/      # Prisma service
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── frontend/            # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/        # Rotas (App Router)
│   │   ├── components/ # Componentes React
│   │   ├── hooks/      # Custom hooks
│   │   └── stores/     # Zustand stores
│   └── public/
│
├── ai-service/          # FastAPI
│   ├── src/
│   │   ├── api/        # Rotas
│   │   ├── models/     # Modelos ML
│   │   └── agent/      # Agente conversacional
│   └── requirements.txt
│
├── docs/                # Documentação
│   └── desenvolvimento/
│
├── scripts/             # Scripts de automação
│   ├── setup.sh        # Setup Linux/Mac
│   ├── setup.bat       # Setup Windows
│   └── validate-setup.js
│
├── certs/              # Certificados SSL (gerados)
├── docker-compose.yml  # Orquestração Docker
├── .env.example        # Template de variáveis
└── README.md           # Este arquivo
```

## 💻 Desenvolvimento

### Iniciar Todos os Serviços

```bash
# Opção 1: Docker Compose (recomendado)
docker-compose up -d

# Opção 2: Cada serviço separadamente
npm run dev          # Frontend + Backend (concurrently)
npm run ai:dev       # AI Service

# Opção 3: Manualmente em terminais separados
cd backend && npm run start:dev     # Terminal 1
cd frontend && npm run dev          # Terminal 2
cd ai-service && source .venv/bin/activate && uvicorn main:app --reload --port 8001  # Terminal 3
```

### URLs dos Serviços

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3002
- **AI Service**: http://localhost:8001
- **Prisma Studio**: `npm run db:studio`
- **RabbitMQ Management**: http://localhost:15672 (admin/admin)

### HTTPS Local (para Meta OAuth)

Se precisar usar HTTPS localmente (necessário para integração com Meta):

```bash
# 1. Gerar certificados
npm run generate-certs

# 2. Instalar certificado no sistema
# Ver: README-HTTPS.md

# 3. Iniciar com HTTPS
npm run dev:https
```

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend
npm run dev:https        # Frontend + Backend com HTTPS
npm run ai:dev           # AI Service

# Build
npm run build            # Build de todos os projetos

# Qualidade de Código
npm run lint             # Lint em todos os projetos
npm run format           # Formatar com Prettier
npm run type-check       # TypeScript type checking

# Banco de Dados
npm run db:migrate       # Executar migrations
npm run db:generate      # Gerar Prisma Client
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Executar seed

# Docker
npm run docker:up        # Subir todos os containers
npm run docker:down      # Parar todos os containers
npm run docker:logs      # Ver logs

# Validação
npm run validate         # Validar setup
```

### Testes

```bash
# Backend (Jest)
cd backend
npm test                 # Todos os testes
npm run test:watch       # Watch mode
npm run test:cov         # Com coverage

# AI Service (Pytest)
cd ai-service
source .venv/bin/activate
pytest                   # Todos os testes
pytest --cov             # Com coverage
```

## 🚢 Deploy

Consulte o arquivo [DEPLOY.md](DEPLOY.md) para instruções detalhadas de deploy em:

- AWS (EC2, RDS, S3, ECS)
- Google Cloud (Cloud Run, Cloud SQL)
- Azure (App Service, Database)
- Docker Swarm / Kubernetes

### Checklist Pré-Deploy

- [ ] Variáveis de ambiente de produção configuradas
- [ ] Banco de dados de produção criado
- [ ] Migrations executadas
- [ ] Seeds executados (se necessário)
- [ ] Certificados SSL configurados
- [ ] DNS apontando para servidor
- [ ] Backup automático configurado
- [ ] Monitoring configurado (Sentry, DataDog, etc.)

## 📚 Documentação

### Documentação Completa

- [Setup de Desenvolvimento](docs/desenvolvimento/setup-desenvolvimento.md)
- [Comandos Úteis](docs/desenvolvimento/comandos-uteis.md)
- [Configuração HTTPS](README-HTTPS.md)
- [Deploy](DEPLOY.md)
- [Arquitetura](docs/arquitetura/)
- [API Reference](docs/api/)

### Guias Específicos

- [Regras de Desenvolvimento](docs/desenvolvimento/regras-desenvolvimento.md)
- [Frontend - Next.js](docs/frontend/)
- [Backend - NestJS](docs/backend/)
- [AI Service - FastAPI](docs/ai-service/)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga os seguintes passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova feature
- `fix:` Correção de bug
- `docs:` Alteração em documentação
- `style:` Formatação, ponto e vírgula, etc (sem mudança de código)
- `refactor:` Refatoração de código
- `test:` Adição ou modificação de testes
- `chore:` Atualização de dependências, configurações, etc

## 🔒 Segurança

Se você descobrir alguma vulnerabilidade de segurança, por favor **NÃO** abra uma issue pública. Envie um email para [security@medsaas.com](mailto:security@medsaas.com).

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🆘 Suporte

Encontrou algum problema? Tem dúvidas?

- 📖 [Documentação](docs/)
- 🐛 [Reportar Bug](https://github.com/seu-usuario/medsaas-oncologia/issues)
- 💬 [Discussões](https://github.com/seu-usuario/medsaas-oncologia/discussions)
- 📧 Email: [suporte@medsaas.com](mailto:suporte@medsaas.com)

---

<p align="center">
  Feito com ❤️ pela equipe MedSaaS
</p>
