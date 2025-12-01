# 📦 Guia de Instalação - OncoSaas

Este guia detalha o processo completo de instalação do ambiente de desenvolvimento.

---

## Pré-requisitos

### Software Obrigatório

| Software | Versão Mínima | Download |
|----------|---------------|----------|
| Node.js | 18.x LTS | [nodejs.org](https://nodejs.org/) |
| Python | 3.11+ | [python.org](https://www.python.org/) |
| Docker | 20.10+ | [docker.com](https://www.docker.com/) |
| Docker Compose | 2.x | Incluído no Docker Desktop |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |

### Verificar Instalações

```bash
node --version    # v18.x.x ou superior
npm --version     # 9.x.x ou superior
python --version  # Python 3.11.x ou superior
docker --version  # Docker version 20.x.x
docker compose version  # Docker Compose version v2.x.x
git --version     # git version 2.x.x
```

---

## Instalação Passo a Passo

### 1. Clonar o Repositório

```bash
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas
```

### 2. Configurar Variáveis de Ambiente

#### Backend

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env`:
```env
# Database
DATABASE_URL="postgresql://oncosaas:oncosaas@localhost:5433/oncosaas?schema=public"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# WhatsApp (opcional para desenvolvimento inicial)
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_WEBHOOK_VERIFY_TOKEN=""

# Facebook OAuth (opcional)
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_REDIRECT_URI="https://localhost:3001/auth/facebook/callback"

# AI Service
AI_SERVICE_URL="http://localhost:8000"

# Redis
REDIS_URL="redis://localhost:6379"
```

#### Frontend

```bash
cp frontend/.env.example frontend/.env.local
```

Edite `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001

# NextAuth (se usando)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-nextauth-secret"
```

#### AI Service

```bash
cp ai-service/.env.example ai-service/.env
```

Edite `ai-service/.env`:
```env
# LLM API
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

# Server
HOST=0.0.0.0
PORT=8000

# Backend API
BACKEND_URL="http://localhost:3001"
```

### 3. Iniciar Infraestrutura (Docker)

```bash
# Iniciar PostgreSQL, Redis e RabbitMQ
docker compose up -d

# Verificar se os containers estão rodando
docker compose ps
```

**Serviços iniciados**:
| Serviço | Porta | Descrição |
|---------|-------|-----------|
| PostgreSQL | 5433 | Banco de dados principal |
| Redis | 6379 | Cache e sessões |
| RabbitMQ | 5672, 15672 | Fila de mensagens |

### 4. Instalar Dependências

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd frontend
npm install
```

#### AI Service

```bash
cd ai-service
pip install -r requirements.txt
# OU com venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

### 5. Configurar Banco de Dados

```bash
cd backend

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate:dev

# Popular com dados de teste (seed)
npm run prisma:seed
```

**Dados de seed incluídos**:
- 1 Tenant de teste (Hospital Teste)
- 4 Usuários (admin, nurse, oncologist, manager)
- 20+ Pacientes com dados variados
- Mensagens de exemplo
- Alertas de exemplo
- Jornadas de navegação

### 6. Iniciar Servidores

Abra 3 terminais:

**Terminal 1 - Backend**:
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Service** (opcional):
```bash
cd ai-service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Verificar Instalação

| Serviço | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | Página de login |
| Backend API | http://localhost:3001/health | `{"status":"ok"}` |
| Prisma Studio | http://localhost:5555 | Interface do banco |
| AI Service | http://localhost:8000/docs | Swagger do FastAPI |
| RabbitMQ Admin | http://localhost:15672 | guest/guest |

---

## Credenciais de Teste

| Email | Senha | Role |
|-------|-------|------|
| admin@hospitalteste.com | senha123 | Admin |
| enfermeira@hospitalteste.com | senha123 | Nurse |
| oncologista@hospitalteste.com | senha123 | Oncologist |
| gestor@hospitalteste.com | senha123 | Manager |

---

## Setup HTTPS (Opcional)

Para integração com WhatsApp Business API, HTTPS local é necessário.

### Gerar Certificado

```bash
cd scripts

# Windows
./gerar-certificado-https.bat

# Linux/Mac
./gerar-certificado-https.sh
```

### Confiar no Certificado (Windows)

1. Abra `certlm.msc` (Certificados do computador local)
2. Vá para **Autoridades de Certificação Raiz Confiáveis** > **Certificados**
3. Clique com botão direito > **Todas as Tarefas** > **Importar**
4. Selecione `certs/server.crt`

### Iniciar com HTTPS

```bash
# Backend
cd backend
npm run start:https

# Frontend
cd frontend
npm run dev:https
```

Para detalhes completos, veja [README-HTTPS.md](../README-HTTPS.md).

---

## Problemas Comuns

### 1. Erro de Conexão com PostgreSQL

```
Error: P1001: Can't reach database server at `localhost:5433`
```

**Solução**:
```bash
# Verificar se container está rodando
docker compose ps

# Reiniciar containers
docker compose down
docker compose up -d

# Verificar logs
docker compose logs postgres
```

### 2. Porta já em uso

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solução**:
```bash
# Linux/Mac
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### 3. Erro de Prisma

```
Error: EPERM: operation not permitted
```

**Solução**:
```bash
# Remover node_modules e reinstalar
rm -rf node_modules
rm -rf backend/node_modules/.prisma
npm install
npm run prisma:generate
```

### 4. Python não encontrado

```
'python' is not recognized as an internal or external command
```

**Solução**:
- Windows: Reinstalar Python marcando "Add to PATH"
- Linux: `sudo apt install python3 python3-pip`
- Mac: `brew install python3`

### 5. Docker não inicia containers

```
Error response from daemon: Ports are not available
```

**Solução**:
```bash
# Verificar processos usando as portas
docker compose down
docker system prune -f
docker compose up -d
```

---

## Comandos Úteis

### Docker

```bash
# Ver logs de todos os containers
docker compose logs -f

# Reiniciar um serviço específico
docker compose restart postgres

# Parar tudo
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados)
docker compose down -v
```

### Prisma

```bash
# Ver banco de dados visualmente
npm run prisma:studio

# Resetar banco (apaga dados)
npm run prisma:reset

# Ver queries SQL geradas
DEBUG="prisma:query" npm run start:dev
```

### NPM

```bash
# Limpar cache
npm cache clean --force

# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit
```

---

## Próximos Passos

1. ✅ Instalação completa
2. 📖 Leia o [Quick Start](./QUICKSTART.md)
3. 🔧 Configure o [WhatsApp Integration](../README-HTTPS.md)
4. 📚 Explore a [Documentação da API](./API.md)
5. 🤝 Veja como [Contribuir](../CONTRIBUTING.md)

---

## Suporte

Se encontrar problemas:

1. Verifique esta documentação
2. Consulte os [Issues do GitHub](https://github.com/luizfiorimr/OncoSaas/issues)
3. Crie um novo issue com:
   - Sistema operacional
   - Versões dos softwares
   - Logs de erro completos
   - Passos para reproduzir
