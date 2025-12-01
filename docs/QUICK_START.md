# ⚡ Quick Start - OncoSaas

Guia rápido para começar a usar o OncoSaas em 5 minutos.

## 🚀 Setup Rápido

### 1. Pré-requisitos

Certifique-se de ter instalado:
- Node.js 18+
- Python 3.11+
- Docker e Docker Compose
- Git

### 2. Clonar e Instalar

```bash
# Clonar repositório
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas

# Instalar dependências
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd ai-service && pip install -r requirements.txt && cd ..
```

### 3. Configurar Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env (mínimo necessário):
# DATABASE_URL=postgresql://medsaas:medsaas_dev@localhost:5433/medsaas_development
# JWT_SECRET=your-secret-key-change-in-production
```

### 4. Iniciar Serviços

```bash
# Iniciar PostgreSQL, Redis, RabbitMQ
docker-compose up -d

# Configurar banco de dados
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..

# Iniciar aplicação
npm run dev
```

### 5. Acessar

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3002
- **AI Service**: http://localhost:8001

## 📝 Primeiros Passos

### Criar Usuário Admin

```bash
# Via Prisma Studio (interface visual)
cd backend
npm run prisma:studio
# Acessar http://localhost:5555 e criar usuário manualmente

# Ou via script (quando disponível)
npm run prisma:seed
```

### Testar API

```bash
# Login
curl -X POST http://localhost:3002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Listar pacientes (com token)
curl -X GET http://localhost:3002/api/v1/patients \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Próximos Passos

1. **Configurar WhatsApp Business API**
   - Veja: [docs/arquitetura/agente-whatsapp.md](arquitetura/agente-whatsapp.md)

2. **Entender a Arquitetura**
   - Veja: [docs/arquitetura/README.md](arquitetura/README.md)

3. **Desenvolver Features**
   - Veja: [docs/desenvolvimento/GUIA_COMPLETO.md](desenvolvimento/GUIA_COMPLETO.md)

4. **Explorar Documentação**
   - Veja: [docs/README.md](README.md)

## 🆘 Problemas Comuns

### Porta já em uso
```bash
# Verificar processos
lsof -i :3000
lsof -i :3002
lsof -i :8001

# Matar processo
kill -9 <PID>
```

### Banco não conecta
```bash
# Verificar Docker
docker-compose ps

# Reiniciar
docker-compose restart postgres
```

### Prisma Client desatualizado
```bash
cd backend
npm run prisma:generate
```

## 📚 Documentação Completa

- [Documentação Principal](README.md)
- [Guia de Desenvolvimento](desenvolvimento/GUIA_COMPLETO.md)
- [Documentação da API](API/README.md)
- [Guia de Deployment](DEPLOYMENT.md)

---

**Tempo estimado**: 5-10 minutos
