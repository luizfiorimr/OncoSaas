# 🚀 Guia de Deployment

Guia completo para fazer deploy do OncoSaas em diferentes ambientes.

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Ambiente de Desenvolvimento](#ambiente-de-desenvolvimento)
3. [Ambiente de Staging](#ambiente-de-staging)
4. [Ambiente de Produção](#ambiente-de-produção)
5. [CI/CD](#cicd)
6. [Monitoramento](#monitoramento)
7. [Backup e Recuperação](#backup-e-recuperação)
8. [Troubleshooting](#troubleshooting)

## 📦 Pré-requisitos

### Infraestrutura

- **Servidor**: Ubuntu 20.04+ ou similar
- **Docker** e **Docker Compose**
- **Nginx** (para reverse proxy)
- **SSL Certificate** (Let's Encrypt recomendado)
- **Domain** configurado

### Variáveis de Ambiente

Todas as variáveis devem ser configuradas no ambiente de destino. Veja `.env.example` para referência completa.

## 🛠️ Ambiente de Desenvolvimento

### Setup Local

```bash
# 1. Clonar repositório
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas

# 2. Instalar dependências
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-service && pip install -r requirements.txt && cd ..

# 3. Configurar .env
cp .env.example .env
# Editar .env com configurações locais

# 4. Iniciar serviços Docker
docker-compose up -d

# 5. Executar migrations
cd backend
npm run prisma:migrate
npm run prisma:generate

# 6. Iniciar aplicação
cd ..
npm run dev
```

### Acessos

- Frontend: http://localhost:3000
- Backend API: http://localhost:3002
- AI Service: http://localhost:8001
- Prisma Studio: http://localhost:5555 (após `npm run db:studio`)

## 🧪 Ambiente de Staging

### Setup com Docker Compose

```bash
# 1. No servidor de staging
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas
git checkout staging

# 2. Configurar .env.staging
cp .env.example .env.staging
# Editar com configurações de staging

# 3. Build e iniciar
docker-compose -f docker-compose.staging.yml up -d --build

# 4. Executar migrations
docker-compose -f docker-compose.staging.yml exec backend npm run prisma:migrate deploy
```

### docker-compose.staging.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api-staging.example.com
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

## 🏭 Ambiente de Produção

### Arquitetura Recomendada

```
┌─────────────────────────────────────────┐
│           Nginx (Reverse Proxy)          │
│         SSL/TLS Termination              │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐         ┌──────▼────┐
│Frontend│         │  Backend  │
│(Next.js)│         │ (NestJS)  │
└───┬────┘         └──────┬────┘
    │                     │
    │              ┌──────▼────┐
    │              │AI Service │
    │              │(FastAPI)  │
    │              └──────┬────┘
    │                     │
    └──────────┬──────────┘
               │
        ┌──────▼────┐
        │ PostgreSQL │
        └───────────┘
```

### Setup Manual

#### 1. Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose -y

# Instalar Nginx
sudo apt install nginx -y

# Instalar Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y
```

#### 2. Configurar Aplicação

```bash
# Clonar repositório
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas
git checkout main

# Configurar .env.production
cp .env.example .env.production
# Editar com configurações de produção
```

#### 3. Build das Aplicações

```bash
# Frontend
cd frontend
npm install
npm run build
cd ..

# Backend
cd backend
npm install
npm run build
npm run prisma:generate
cd ..

# AI Service
cd ai-service
pip install -r requirements.txt
cd ..
```

#### 4. Configurar Nginx

```nginx
# /etc/nginx/sites-available/oncosaas
server {
    listen 80;
    server_name oncosaas.example.com;

    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name oncosaas.example.com;

    ssl_certificate /etc/letsencrypt/live/oncosaas.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oncosaas.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # AI Service
    location /ai {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/oncosaas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Configurar SSL

```bash
# Obter certificado
sudo certbot --nginx -d oncosaas.example.com

# Renovação automática (já configurado por padrão)
sudo certbot renew --dry-run
```

#### 6. Iniciar Aplicação

```bash
# Usar PM2 para gerenciar processos
npm install -g pm2

# Iniciar serviços
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save
pm2 startup
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'oncosaas-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'oncosaas-backend',
      script: 'npm',
      args: 'start:prod',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    },
    {
      name: 'oncosaas-ai-service',
      script: 'uvicorn',
      args: 'main:app --host 0.0.0.0 --port 8001',
      cwd: './ai-service',
      interpreter: 'python3',
      env: {
        ENVIRONMENT: 'production'
      }
    }
  ]
};
```

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install
          cd backend && npm install && cd ..
          cd frontend && npm install && cd ..
      
      - name: Build
        run: |
          cd frontend && npm run build && cd ..
          cd backend && npm run build && cd ..
      
      - name: Run tests
        run: |
          cd backend && npm test && cd ..
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/OncoSaas
            git pull
            docker-compose -f docker-compose.prod.yml up -d --build
            docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate deploy
```

## 📊 Monitoramento

### Health Checks

```bash
# Backend
curl http://localhost:3002/health

# AI Service
curl http://localhost:8001/health
```

### Logs

```bash
# PM2 logs
pm2 logs

# Docker logs
docker-compose logs -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Métricas

- **Uptime**: Monitorar com UptimeRobot ou similar
- **Performance**: New Relic, Datadog, ou Prometheus
- **Errors**: Sentry para tracking de erros

## 💾 Backup e Recuperação

### Backup do Banco de Dados

```bash
# Backup diário
pg_dump -U medsaas -d medsaas_production > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U medsaas -d medsaas_production < backup_20240101.sql
```

### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/oncosaas"
DATE=$(date +%Y%m%d_%H%M%S)

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec medsaas-postgres pg_dump -U medsaas medsaas_production > $BACKUP_DIR/db_$DATE.sql

# Backup arquivos (uploads, etc.)
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/uploads

# Manter apenas últimos 30 dias
find $BACKUP_DIR -type f -mtime +30 -delete
```

```bash
# Adicionar ao crontab
crontab -e
# 0 2 * * * /path/to/backup.sh
```

## 🔍 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
pm2 logs
docker-compose logs

# Verificar portas
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3002

# Verificar variáveis de ambiente
pm2 env <app-name>
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
psql -U medsaas -d medsaas_production -h localhost

# Verificar DATABASE_URL no .env
```

### SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Última atualização**: 2024-01-XX
