# 🚀 Guia de Deployment - OncoSaas

Este guia detalha como fazer deploy da plataforma OncoSaas em diferentes ambientes.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Ambientes](#ambientes)
- [Deploy em Produção](#deploy-em-produção)
- [Deploy em Staging](#deploy-em-staging)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [CI/CD](#cicd)
- [Monitoramento](#monitoramento)
- [Backup e Restore](#backup-e-restore)
- [Rollback](#rollback)

## Pré-requisitos

### Infraestrutura Necessária

- **Servidor de Aplicação**: 2+ cores, 4GB+ RAM
- **Banco de Dados**: PostgreSQL 15+ (recomendado: Amazon RDS, Digital Ocean Managed Database)
- **Redis**: Para cache e sessions (opcional mas recomendado)
- **CDN**: Para assets estáticos (Cloudflare, AWS CloudFront)
- **Object Storage**: Para uploads (AWS S3, DigitalOcean Spaces)

### Ferramentas

- Docker e Docker Compose
- Node.js 18+
- Python 3.11+
- Git
- CLI do provedor cloud (AWS CLI, Vercel CLI, etc.)

## Ambientes

### Desenvolvimento (Local)

```bash
# Ver docs/desenvolvimento/setup-desenvolvimento.md
docker-compose up -d
npm run dev
```

### Staging

Ambiente de pré-produção para testes finais.

**URL:** `https://staging.oncosaas.com`

### Produção

Ambiente live para usuários reais.

**URL:** `https://app.oncosaas.com`

## Deploy em Produção

### Opção 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Next.js) → Vercel

**1. Instalar Vercel CLI:**

```bash
npm install -g vercel
```

**2. Configurar projeto:**

```bash
cd frontend
vercel
```

**3. Configurar variáveis de ambiente no Vercel:**

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Adicionar todas as variáveis necessárias
```

**4. Deploy:**

```bash
# Preview
vercel

# Produção
vercel --prod
```

**5. Configurar domínio customizado:**

No dashboard Vercel:
- Settings → Domains
- Adicionar `app.oncosaas.com`
- Configurar DNS (CNAME para vercel)

#### Backend (NestJS) → Railway

**1. Criar conta no Railway:**

https://railway.app

**2. Criar novo projeto:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Linkar projeto
railway link
```

**3. Adicionar PostgreSQL:**

No dashboard Railway:
- New → Database → PostgreSQL
- Copiar `DATABASE_URL`

**4. Configurar variáveis:**

```bash
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=<postgres-url>
railway variables set JWT_SECRET=<seu-secret>
# ... demais variáveis
```

**5. Deploy:**

```bash
cd backend
railway up
```

#### AI Service (FastAPI) → Render

**1. Criar `render.yaml`:**

```yaml
# render.yaml na raiz
services:
  - type: web
    name: oncosaas-ai-service
    env: python
    buildCommand: pip install -r ai-service/requirements.txt
    startCommand: uvicorn ai-service.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: oncosaas-db
          property: connectionString
```

**2. Deploy via GitHub:**

- Conectar repositório
- Render detecta `render.yaml` automaticamente
- Configura variáveis de ambiente
- Deploy automático

### Opção 2: AWS (Completo)

#### Arquitetura AWS

```
Internet
    ↓
CloudFront (CDN) → S3 (Frontend estático)
    ↓
Route 53 (DNS)
    ↓
ALB (Application Load Balancer)
    ↓
ECS (Elastic Container Service)
    ├── Backend (NestJS) - Fargate
    └── AI Service (FastAPI) - Fargate
    ↓
RDS (PostgreSQL)
ElastiCache (Redis)
```

#### 1. Configurar RDS (PostgreSQL)

```bash
# Via AWS Console ou CLI
aws rds create-db-instance \
  --db-instance-identifier oncosaas-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password <senha-forte> \
  --allocated-storage 20 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false
```

#### 2. Configurar ElastiCache (Redis)

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id oncosaas-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### 3. Build e Push de Imagens Docker

**Backend:**

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
```

```bash
# Build
docker build -t oncosaas-backend:latest ./backend

# Tag para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag oncosaas-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/oncosaas-backend:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/oncosaas-backend:latest
```

**AI Service:**

```dockerfile
# ai-service/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Similar ao backend
docker build -t oncosaas-ai:latest ./ai-service
docker tag oncosaas-ai:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/oncosaas-ai:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/oncosaas-ai:latest
```

#### 4. Configurar ECS (Fargate)

**Task Definition (backend):**

```json
{
  "family": "oncosaas-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/oncosaas-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "3001" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:oncosaas/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:oncosaas/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/oncosaas-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Criar Service:**

```bash
aws ecs create-service \
  --cluster oncosaas-prod \
  --service-name backend \
  --task-definition oncosaas-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=3001"
```

#### 5. Configurar ALB

```bash
# Criar target group
aws elbv2 create-target-group \
  --name oncosaas-backend-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /health

# Criar load balancer
aws elbv2 create-load-balancer \
  --name oncosaas-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --scheme internet-facing

# Criar listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

#### 6. Deploy Frontend (S3 + CloudFront)

```bash
# Build frontend
cd frontend
npm run build

# Upload para S3
aws s3 sync out/ s3://oncosaas-frontend-prod --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Opção 3: DigitalOcean App Platform

**1. Criar `app.yaml`:**

```yaml
name: oncosaas
region: nyc
services:
  - name: frontend
    github:
      repo: seu-usuario/oncosaas
      branch: main
      deploy_on_push: true
    build_command: cd frontend && npm install && npm run build
    run_command: cd frontend && npm start
    envs:
      - key: NEXT_PUBLIC_API_URL
        value: https://api.oncosaas.com
    instance_size_slug: basic-xxs
    instance_count: 1
    routes:
      - path: /
  
  - name: backend
    github:
      repo: seu-usuario/oncosaas
      branch: main
      deploy_on_push: true
    build_command: cd backend && npm install && npm run build
    run_command: cd backend && npm run start:prod
    envs:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: ${db.DATABASE_URL}
    instance_size_slug: basic-xs
    instance_count: 2
    routes:
      - path: /api
  
  - name: ai-service
    github:
      repo: seu-usuario/oncosaas
      branch: main
    build_command: cd ai-service && pip install -r requirements.txt
    run_command: cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000
    instance_size_slug: basic-xs
    instance_count: 1

databases:
  - name: db
    engine: PG
    version: "15"
    size: db-s-1vcpu-1gb
    num_nodes: 1
```

**2. Deploy:**

```bash
# Via CLI
doctl apps create --spec app.yaml

# Ou via Dashboard: App Platform → Create App → Import from GitHub
```

## Variáveis de Ambiente

### Frontend (Next.js)

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.oncosaas.com
NEXT_PUBLIC_WS_URL=wss://api.oncosaas.com
NEXT_PUBLIC_ENV=production
```

### Backend (NestJS)

```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@host:5432/oncosaas_prod

# JWT
JWT_SECRET=<secret-forte-64-chars>
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# Redis (cache)
REDIS_URL=redis://host:6379

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# WhatsApp
WHATSAPP_API_TOKEN=<token>
WHATSAPP_PHONE_NUMBER_ID=<id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<token>

# AWS (opcional)
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=oncosaas-uploads

# Monitoring
SENTRY_DSN=https://...
```

### AI Service (FastAPI)

```bash
# .env.production
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:password@host:5432/oncosaas_prod
CHROMA_PERSIST_DIR=/app/chroma_data
MODEL_PATH=/app/models/priority_model.pkl
```

## CI/CD

### GitHub Actions

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test
      
      - name: Run linter
        run: |
          cd backend
          npm run lint

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: oncosaas-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster oncosaas-prod \
            --service backend \
            --force-new-deployment

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Monitoramento

### Health Checks

**Backend:**

```typescript
// backend/src/health/health.controller.ts
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // Verificar conexão
    redis: 'connected'
  };
}
```

**Configurar no ALB/Railway:**

- Health Check Path: `/health`
- Interval: 30s
- Timeout: 5s
- Healthy threshold: 2
- Unhealthy threshold: 3

### Logging

**Usar estrutura JSON:**

```typescript
logger.log({
  level: 'info',
  message: 'Patient created',
  patientId: patient.id,
  tenantId: tenant.id,
  userId: user.id,
  timestamp: new Date().toISOString()
});
```

**Integrar com:**
- CloudWatch Logs (AWS)
- Datadog
- Sentry (erros)

### Métricas

**Configurar APM:**

```typescript
// main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

## Backup e Restore

### Backup Automático (PostgreSQL)

**1. Backup diário via cron:**

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="oncosaas_prod"

pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload para S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://oncosaas-backups/

# Manter apenas últimos 30 dias
find $BACKUP_DIR -mtime +30 -delete
```

**2. Agendar cron:**

```bash
crontab -e
# Adicionar:
0 2 * * * /path/to/backup.sh
```

### Restore

```bash
# Download do S3
aws s3 cp s3://oncosaas-backups/backup_20240115_020000.sql.gz .

# Descompactar
gunzip backup_20240115_020000.sql.gz

# Restore
psql $DATABASE_URL < backup_20240115_020000.sql
```

## Rollback

### Rollback do Backend (ECS)

```bash
# Listar deployments
aws ecs list-task-definitions --family-prefix oncosaas-backend

# Rollback para versão anterior
aws ecs update-service \
  --cluster oncosaas-prod \
  --service backend \
  --task-definition oncosaas-backend:5  # versão anterior
```

### Rollback do Frontend (Vercel)

No dashboard Vercel:
- Deployments → Selecionar versão anterior → Promote to Production

Ou via CLI:

```bash
vercel rollback <deployment-url>
```

## Checklist de Deploy

- [ ] Testes passando (CI)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados migrado (`npm run migrate:deploy`)
- [ ] Backup recente disponível
- [ ] Health checks configurados
- [ ] Monitoring ativo (Sentry, Datadog)
- [ ] SSL/TLS configurado
- [ ] DNS configurado
- [ ] Rate limiting ativado
- [ ] Logs estruturados
- [ ] Plano de rollback documentado
- [ ] Equipe notificada do deploy

---

**Última atualização**: 2024-01-XX  
**Versão**: 1.0.0

**Próximos passos:**
- [Troubleshooting](TROUBLESHOOTING.md)
- [Monitoring Guide](MONITORING.md)
- [Security Checklist](compliance-legal/checklist-compliance.md)
