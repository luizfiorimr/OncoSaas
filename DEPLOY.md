# 🚀 Guia de Deploy - MedSaaS Oncologia

Este guia detalha o processo de deploy da aplicação em diferentes ambientes de produção.

## 📋 Índice

- [Checklist Pré-Deploy](#checklist-pré-deploy)
- [Deploy com Docker](#deploy-com-docker)
- [Deploy em AWS](#deploy-em-aws)
- [Deploy em Google Cloud](#deploy-em-google-cloud)
- [Deploy em Azure](#deploy-em-azure)
- [Configurações de Produção](#configurações-de-produção)
- [Monitoramento](#monitoramento)
- [Backup e Recuperação](#backup-e-recuperação)
- [Troubleshooting](#troubleshooting)

## ✅ Checklist Pré-Deploy

Antes de fazer o deploy, certifique-se de:

### Configuração

- [ ] Variáveis de ambiente de produção configuradas
- [ ] Secrets configurados de forma segura (AWS Secrets Manager, GCP Secret Manager, etc.)
- [ ] Certificados SSL válidos configurados
- [ ] DNS configurado e apontando para o servidor
- [ ] CORS configurado corretamente para domínio de produção
- [ ] Rate limiting habilitado

### Banco de Dados

- [ ] Banco de dados de produção criado e acessível
- [ ] Backup automático configurado
- [ ] Migrations executadas
- [ ] Seeds executados (se necessário)
- [ ] Índices otimizados
- [ ] Pool de conexões configurado

### Segurança

- [ ] JWT_SECRET forte e aleatório
- [ ] ENCRYPTION_KEY forte e aleatório
- [ ] Senhas default alteradas (PostgreSQL, Redis, RabbitMQ)
- [ ] Firewall configurado (portas necessárias abertas)
- [ ] HTTPS obrigatório
- [ ] Headers de segurança configurados (Helmet.js)
- [ ] Data anonymization habilitado

### APIs Externas

- [ ] OpenAI API Key configurada
- [ ] Anthropic API Key configurada
- [ ] Meta WhatsApp Business API configurada
- [ ] Google Cloud STT configurado
- [ ] AWS S3 configurado
- [ ] FHIR Integration configurada (se aplicável)

### Monitoramento

- [ ] Sentry configurado (error tracking)
- [ ] DataDog/New Relic configurado (APM)
- [ ] Logs centralizados configurados
- [ ] Health checks configurados
- [ ] Alertas configurados

### Performance

- [ ] CDN configurado para assets estáticos
- [ ] Compressão habilitada (gzip/brotli)
- [ ] Cache configurado (Redis)
- [ ] Database indexes otimizados

## 🐳 Deploy com Docker

### 1. Build das Imagens

```bash
# Build de todas as imagens
docker-compose build

# Ou build individual
docker build -t medsaas-backend:latest ./backend
docker build -t medsaas-frontend:latest ./frontend
docker build -t medsaas-ai-service:latest ./ai-service
```

### 2. Configurar docker-compose.prod.yml

Crie um arquivo `docker-compose.prod.yml` para produção:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    # Não expor porta publicamente
    
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal
    
  rabbitmq:
    image: rabbitmq:3-management-alpine
    restart: always
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - internal
  
  backend:
    image: medsaas-backend:latest
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      RABBITMQ_URL: amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - internal
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.medsaas.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
  
  frontend:
    image: medsaas-frontend:latest
    restart: always
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: https://api.medsaas.com
      NEXT_PUBLIC_WS_URL: wss://api.medsaas.com
    depends_on:
      - backend
    networks:
      - web
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`medsaas.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
  
  ai-service:
    image: medsaas-ai-service:latest
    restart: always
    environment:
      BACKEND_URL: http://backend:3002
    env_file:
      - .env.production
    depends_on:
      - backend
      - redis
    networks:
      - internal

  # Reverse Proxy (Traefik)
  traefik:
    image: traefik:v2.10
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - web

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:

networks:
  web:
    external: true
  internal:
    internal: true
```

### 3. Deploy

```bash
# Criar network
docker network create web

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Executar migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## ☁️ Deploy em AWS

### Arquitetura Recomendada

- **EC2** ou **ECS Fargate**: Containers da aplicação
- **RDS PostgreSQL**: Banco de dados gerenciado
- **ElastiCache Redis**: Cache gerenciado
- **Amazon MQ (RabbitMQ)**: Message queue gerenciado
- **S3**: Armazenamento de arquivos (áudios)
- **CloudFront**: CDN
- **ALB**: Load balancer
- **Route 53**: DNS
- **ACM**: Certificados SSL
- **CloudWatch**: Logs e métricas
- **Secrets Manager**: Gerenciamento de secrets

### 1. Configurar RDS PostgreSQL

```bash
# Via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier medsaas-postgres \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name my-subnet-group \
  --publicly-accessible false
```

### 2. Configurar ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id medsaas-redis \
  --cache-node-type cache.t3.medium \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxx \
  --cache-subnet-group-name my-cache-subnet-group
```

### 3. Deploy via ECS Fargate

#### 3.1. Criar Task Definitions

**backend-task-definition.json:**

```json
{
  "family": "medsaas-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ECR_REPO/medsaas-backend:latest",
      "portMappings": [
        {
          "containerPort": 3002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:medsaas/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/medsaas-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3.2. Deploy

```bash
# Build e push para ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ECR_URI

docker tag medsaas-backend:latest YOUR_ECR_REPO/medsaas-backend:latest
docker push YOUR_ECR_REPO/medsaas-backend:latest

# Registrar task definition
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json

# Criar service
aws ecs create-service \
  --cluster medsaas-cluster \
  --service-name medsaas-backend \
  --task-definition medsaas-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/medsaas-backend/xxx,containerName=backend,containerPort=3002"
```

### 4. Executar Migrations

```bash
# Via ECS Task
aws ecs run-task \
  --cluster medsaas-cluster \
  --task-definition medsaas-backend \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npx","prisma","migrate","deploy"]}]}'
```

## ☁️ Deploy em Google Cloud

### Arquitetura Recomendada

- **Cloud Run**: Containers da aplicação (serverless)
- **Cloud SQL**: PostgreSQL gerenciado
- **Memorystore**: Redis gerenciado
- **Cloud Storage**: Armazenamento de arquivos
- **Cloud CDN**: CDN
- **Cloud Load Balancing**: Load balancer
- **Cloud DNS**: DNS
- **Secret Manager**: Gerenciamento de secrets
- **Cloud Logging**: Logs

### 1. Configurar Cloud SQL

```bash
# Criar instância PostgreSQL
gcloud sql instances create medsaas-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --storage-type=SSD \
  --storage-size=100GB \
  --backup

# Criar database
gcloud sql databases create medsaas_oncologia --instance=medsaas-postgres

# Criar usuário
gcloud sql users create admin --instance=medsaas-postgres --password=YOUR_STRONG_PASSWORD
```

### 2. Deploy via Cloud Run

```bash
# Build e push para Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/medsaas-backend ./backend

# Deploy
gcloud run deploy medsaas-backend \
  --image gcr.io/PROJECT_ID/medsaas-backend \
  --platform managed \
  --region us-central1 \
  --add-cloudsql-instances PROJECT_ID:us-central1:medsaas-postgres \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=medsaas-database-url:latest \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --memory 2Gi \
  --cpu 2
```

## ☁️ Deploy em Azure

### Arquitetura Recomendada

- **App Service** ou **Container Instances**: Containers
- **Azure Database for PostgreSQL**: Banco gerenciado
- **Azure Cache for Redis**: Cache gerenciado
- **Azure Blob Storage**: Armazenamento de arquivos
- **Azure CDN**: CDN
- **Azure Load Balancer**: Load balancer
- **Azure DNS**: DNS
- **Key Vault**: Gerenciamento de secrets

### 1. Configurar Azure Database for PostgreSQL

```bash
# Criar servidor PostgreSQL
az postgres server create \
  --resource-group medsaas-rg \
  --name medsaas-postgres \
  --location eastus \
  --admin-user adminuser \
  --admin-password YOUR_STRONG_PASSWORD \
  --sku-name GP_Gen5_2 \
  --storage-size 102400 \
  --version 15

# Criar database
az postgres db create \
  --resource-group medsaas-rg \
  --server-name medsaas-postgres \
  --name medsaas_oncologia
```

### 2. Deploy via App Service

```bash
# Criar plano do App Service
az appservice plan create \
  --name medsaas-plan \
  --resource-group medsaas-rg \
  --is-linux \
  --sku P1V2

# Criar Web App com container
az webapp create \
  --resource-group medsaas-rg \
  --plan medsaas-plan \
  --name medsaas-backend \
  --deployment-container-image-name YOUR_ACR_REPO/medsaas-backend:latest

# Configurar variáveis de ambiente
az webapp config appsettings set \
  --resource-group medsaas-rg \
  --name medsaas-backend \
  --settings NODE_ENV=production DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://medsaas-vault.vault.azure.net/secrets/database-url/)"
```

## ⚙️ Configurações de Produção

### Variáveis de Ambiente Críticas

```bash
# Gerar secrets fortes
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 32  # ENCRYPTION_KEY

# .env.production
NODE_ENV=production

# URLs HTTPS
NEXT_PUBLIC_API_URL=https://api.medsaas.com
NEXT_PUBLIC_WS_URL=wss://api.medsaas.com
FRONTEND_URL=https://medsaas.com

# Banco de Dados (usar RDS/Cloud SQL/Azure Database)
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/medsaas_oncologia

# Secrets fortes
JWT_SECRET=<gerado-com-openssl>
ENCRYPTION_KEY=<gerado-com-openssl>

# Cache e Queue (usar serviços gerenciados)
REDIS_URL=redis://:password@elasticache-endpoint:6379
RABBITMQ_URL=amqp://user:pass@amazonmq-endpoint:5672

# Segurança
CORS_ORIGIN=https://medsaas.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
ENABLE_DATA_ANONYMIZATION=true

# Logs
LOG_LEVEL=info

# Monitoramento
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Helmet.js (Segurança)

Configurar no `main.ts` do backend:

```typescript
import helmet from '@fastify/helmet';

app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`],
      styleSrc: [`'self'`, `'unsafe-inline'`],
      imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
      scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
    },
  },
});
```

## 📊 Monitoramento

### Sentry (Error Tracking)

```typescript
// backend/src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Health Checks

```typescript
// backend/src/health/health.controller.ts
@Get('/health')
async check() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await this.checkDatabase(),
    redis: await this.checkRedis(),
  };
}
```

### Logs Centralizados

- **CloudWatch** (AWS)
- **Cloud Logging** (GCP)
- **Azure Monitor** (Azure)
- **Datadog**, **New Relic**, **Elastic Stack** (qualquer cloud)

## 💾 Backup e Recuperação

### Backup Automático de Banco de Dados

#### AWS RDS

```bash
# Configurar backup automático (retention 7 dias)
aws rds modify-db-instance \
  --db-instance-identifier medsaas-postgres \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"

# Criar snapshot manual
aws rds create-db-snapshot \
  --db-instance-identifier medsaas-postgres \
  --db-snapshot-identifier medsaas-backup-$(date +%Y%m%d)
```

#### Google Cloud SQL

```bash
# Configurar backup automático
gcloud sql instances patch medsaas-postgres \
  --backup-start-time=03:00 \
  --retained-backups-count=7

# Criar backup manual
gcloud sql backups create --instance=medsaas-postgres
```

### Restauração

```bash
# AWS RDS
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier medsaas-postgres-restored \
  --db-snapshot-identifier medsaas-backup-20240101

# Google Cloud SQL
gcloud sql backups restore BACKUP_ID --backup-instance=medsaas-postgres
```

## 🔧 Troubleshooting

### Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-service

# AWS ECS
aws logs tail /ecs/medsaas-backend --follow

# GCP Cloud Run
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=medsaas-backend" --limit 50

# Azure App Service
az webapp log tail --name medsaas-backend --resource-group medsaas-rg
```

### Problemas Comuns

#### 1. Migrations não executadas

```bash
# Docker
docker-compose exec backend npx prisma migrate deploy

# ECS
aws ecs run-task --cluster medsaas-cluster --task-definition medsaas-backend --overrides '{"containerOverrides":[{"name":"backend","command":["npx","prisma","migrate","deploy"]}]}'
```

#### 2. Conexão com banco recusada

- Verificar security groups (AWS) / firewall rules (GCP) / NSG (Azure)
- Verificar VPC peering / Private Service Connect
- Verificar string de conexão (DATABASE_URL)

#### 3. SSL/TLS errors

- Verificar certificados SSL válidos
- Forçar HTTPS no reverse proxy
- Configurar redirects HTTP → HTTPS

#### 4. Alta latência

- Verificar pool de conexões do banco
- Verificar cache Redis
- Habilitar CDN para assets estáticos
- Otimizar queries N+1 com Prisma includes

---

## 🆘 Suporte

Se encontrar problemas durante o deploy:

- 📖 [Documentação](docs/)
- 🐛 [Reportar Bug](https://github.com/seu-usuario/medsaas-oncologia/issues)
- 📧 Email: [suporte@medsaas.com](mailto:suporte@medsaas.com)

---

<p align="center">
  Feito com ❤️ pela equipe MedSaaS
</p>
