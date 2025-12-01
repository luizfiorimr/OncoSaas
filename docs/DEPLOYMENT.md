# 🚀 Guia de Deploy - OncoSaas

Este documento descreve os procedimentos para implantação do OncoSaas em diferentes ambientes.

---

## Ambientes

| Ambiente | Descrição | URL |
|----------|-----------|-----|
| Local | Desenvolvimento | `http://localhost:3000` |
| Staging | Testes e validação | `https://staging.oncosaas.com` |
| Production | Produção | `https://app.oncosaas.com` |

---

## Arquitetura de Produção (AWS)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront (CDN)                         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                     │
│                     (HTTPS - TLS 1.3)                           │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌───────────┐        ┌───────────┐        ┌───────────┐
    │  Frontend │        │  Backend  │        │ AI Service│
    │  (ECS)    │        │  (ECS)    │        │  (ECS)    │
    │  Next.js  │        │  NestJS   │        │  FastAPI  │
    └───────────┘        └───────────┘        └───────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             ┌───────────┐           ┌───────────┐
             │    RDS    │           │   Redis   │
             │PostgreSQL │           │ElastiCache│
             │  Aurora   │           │           │
             └───────────┘           └───────────┘
```

---

## Pré-requisitos

### Ferramentas

- **AWS CLI** v2+
- **Docker** v24+
- **kubectl** (se EKS)
- **Terraform** (opcional, para IaC)
- **GitHub CLI** (para deploys via Actions)

### Credenciais

```bash
# Configurar AWS CLI
aws configure

# Verificar acesso
aws sts get-caller-identity
```

### Variáveis de Ambiente

Todas as variáveis sensíveis devem estar no **AWS Secrets Manager**:

```json
{
  "DATABASE_URL": "postgresql://...",
  "JWT_SECRET": "...",
  "OPENAI_API_KEY": "sk-...",
  "WHATSAPP_ACCESS_TOKEN": "..."
}
```

---

## Deploy com Docker

### Build das Imagens

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Docker Compose para Staging

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.staging.oncosaas.com
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}

  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=oncosaas
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Build e Push

```bash
# Build
docker build -t oncosaas/backend:latest ./backend
docker build -t oncosaas/frontend:latest ./frontend
docker build -t oncosaas/ai-service:latest ./ai-service

# Tag para ECR
docker tag oncosaas/backend:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/oncosaas/backend:latest

# Login ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/oncosaas/backend:latest
```

---

## Deploy AWS ECS

### Task Definition

```json
{
  "family": "oncosaas-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::123456789:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/oncosaas/backend:latest",
      "portMappings": [
        {
          "containerPort": 4000,
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
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:oncosaas/production:DATABASE_URL::"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:oncosaas/production:JWT_SECRET::"
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

### Service

```bash
# Criar/atualizar serviço
aws ecs update-service \
  --cluster oncosaas-production \
  --service oncosaas-backend \
  --task-definition oncosaas-backend:latest \
  --force-new-deployment
```

---

## Deploy AWS EKS (Kubernetes)

### Manifests

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oncosaas-backend
  namespace: oncosaas
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oncosaas-backend
  template:
    metadata:
      labels:
        app: oncosaas-backend
    spec:
      containers:
        - name: backend
          image: 123456789.dkr.ecr.us-east-1.amazonaws.com/oncosaas/backend:latest
          ports:
            - containerPort: 4000
          env:
            - name: NODE_ENV
              value: production
          envFrom:
            - secretRef:
                name: oncosaas-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: oncosaas-backend
  namespace: oncosaas
spec:
  type: ClusterIP
  ports:
    - port: 4000
      targetPort: 4000
  selector:
    app: oncosaas-backend
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: oncosaas-ingress
  namespace: oncosaas
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:...
spec:
  rules:
    - host: api.oncosaas.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: oncosaas-backend
                port:
                  number: 4000
```

### Deploy

```bash
# Aplicar manifests
kubectl apply -f k8s/

# Verificar status
kubectl get pods -n oncosaas
kubectl get services -n oncosaas

# Logs
kubectl logs -f deployment/oncosaas-backend -n oncosaas
```

---

## CI/CD com GitHub Actions

### Workflow de Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: oncosaas
  ECS_CLUSTER: oncosaas-production

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: cd backend && npm test
      
      - name: Run lint
        run: cd backend && npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push Backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY/backend:$IMAGE_TAG \
            $ECR_REGISTRY/$ECR_REPOSITORY/backend:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY/backend:latest
      
      - name: Build and push Frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG ./frontend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY/frontend:$IMAGE_TAG
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service oncosaas-backend \
            --force-new-deployment
          
          aws ecs update-service \
            --cluster ${{ env.ECS_CLUSTER }} \
            --service oncosaas-frontend \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster ${{ env.ECS_CLUSTER }} \
            --services oncosaas-backend oncosaas-frontend

  notify:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Database Migrations

### Em Deploy

```bash
# Antes do deploy de nova versão
npx prisma migrate deploy

# Em caso de rollback
npx prisma migrate resolve --rolled-back "migration_name"
```

### Script de Migration

```bash
#!/bin/bash
# scripts/migrate.sh

set -e

echo "🔄 Running database migrations..."

# Verificar conexão
npx prisma db push --accept-data-loss=false

# Aplicar migrations
npx prisma migrate deploy

# Verificar status
npx prisma migrate status

echo "✅ Migrations completed successfully"
```

---

## Monitoramento

### Health Checks

```typescript
// backend/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
    };
  }

  @Get('ready')
  async ready() {
    // Verificar conexões
    const db = await this.prisma.$queryRaw`SELECT 1`;
    const redis = await this.redis.ping();
    
    return {
      status: 'ready',
      database: !!db,
      redis: redis === 'PONG',
    };
  }
}
```

### CloudWatch Dashboards

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "oncosaas-backend"],
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "oncosaas-backend"]
        ],
        "title": "Backend Resources"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/oncosaas-alb"],
          ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count"]
        ],
        "title": "Request Metrics"
      }
    }
  ]
}
```

### Alertas

```yaml
# CloudWatch Alarms
- Name: HighCPUUtilization
  Metric: CPUUtilization
  Threshold: 80%
  Period: 5 minutes
  Action: SNS notification

- Name: High5xxErrors
  Metric: HTTPCode_Target_5XX_Count
  Threshold: 10
  Period: 5 minutes
  Action: PagerDuty alert

- Name: DatabaseConnections
  Metric: DatabaseConnections
  Threshold: 90%
  Period: 5 minutes
  Action: Auto-scale RDS
```

---

## Rollback

### ECS

```bash
# Listar task definitions
aws ecs list-task-definitions --family-prefix oncosaas-backend

# Rollback para versão anterior
aws ecs update-service \
  --cluster oncosaas-production \
  --service oncosaas-backend \
  --task-definition oncosaas-backend:previous-revision
```

### Kubernetes

```bash
# Ver histórico de deployments
kubectl rollout history deployment/oncosaas-backend -n oncosaas

# Rollback
kubectl rollout undo deployment/oncosaas-backend -n oncosaas

# Rollback para revisão específica
kubectl rollout undo deployment/oncosaas-backend -n oncosaas --to-revision=2
```

### Database

```bash
# Rollback de migration
npx prisma migrate resolve --rolled-back "20240101000000_migration_name"

# Restaurar backup (RDS)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier oncosaas-production \
  --target-db-instance-identifier oncosaas-restored \
  --restore-time "2024-01-01T12:00:00Z"
```

---

## SSL/TLS

### Certificados (ACM)

```bash
# Solicitar certificado
aws acm request-certificate \
  --domain-name "*.oncosaas.com" \
  --validation-method DNS

# Verificar status
aws acm describe-certificate --certificate-arn arn:aws:acm:...
```

### Configuração ALB

```yaml
# Listeners HTTPS
- Port: 443
  Protocol: HTTPS
  Certificates:
    - CertificateArn: arn:aws:acm:us-east-1:123456789:certificate/...
  DefaultActions:
    - Type: forward
      TargetGroupArn: arn:aws:elasticloadbalancing:...

# Redirect HTTP -> HTTPS
- Port: 80
  Protocol: HTTP
  DefaultActions:
    - Type: redirect
      RedirectConfig:
        Protocol: HTTPS
        Port: "443"
        StatusCode: HTTP_301
```

---

## Checklist de Deploy

### Pré-Deploy

- [ ] Testes passando (CI verde)
- [ ] Code review aprovado
- [ ] Migrations testadas em staging
- [ ] Variáveis de ambiente atualizadas
- [ ] Secrets rotacionados se necessário
- [ ] Backup do banco realizado
- [ ] Comunicação com equipe

### Deploy

- [ ] Build das imagens Docker
- [ ] Push para ECR
- [ ] Aplicar migrations
- [ ] Atualizar serviços ECS/EKS
- [ ] Verificar health checks
- [ ] Testar funcionalidades críticas

### Pós-Deploy

- [ ] Monitorar métricas (15 min)
- [ ] Verificar logs de erro
- [ ] Testar fluxos principais
- [ ] Atualizar documentação se necessário
- [ ] Comunicar conclusão

### Rollback (se necessário)

- [ ] Identificar problema
- [ ] Reverter para versão anterior
- [ ] Reverter migrations se aplicável
- [ ] Verificar estabilidade
- [ ] Post-mortem

---

## Ambientes de Teste

### Staging

```bash
# Deploy para staging
./scripts/deploy.sh staging

# Verificar
curl https://api.staging.oncosaas.com/health
```

### Blue-Green Deployment

```bash
# Deploy para ambiente Blue
aws ecs update-service --cluster oncosaas --service blue --task-definition new

# Testar Blue
curl https://blue.oncosaas.com/health

# Alternar tráfego (Route 53 / ALB)
aws elbv2 modify-listener-default-action ...

# Remover ambiente Green antigo
aws ecs update-service --cluster oncosaas --service green --desired-count 0
```

---

## Custos Estimados (AWS)

| Recurso | Tipo | Custo Mensal Estimado |
|---------|------|----------------------|
| ECS Fargate | 3 tasks x 0.5 vCPU | $50 |
| RDS PostgreSQL | db.t3.medium | $60 |
| ElastiCache Redis | cache.t3.micro | $25 |
| ALB | 1 LCU | $20 |
| CloudWatch | Logs + Métricas | $30 |
| S3 | 50 GB | $1 |
| Route 53 | Hosted Zone | $0.50 |
| **Total** | | **~$190/mês** |

*Valores aproximados para ambiente pequeno. Produção real varia conforme uso.*
