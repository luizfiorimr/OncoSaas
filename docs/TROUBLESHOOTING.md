# 🔧 Guia de Troubleshooting - OncoSaas

Este guia ajuda a resolver problemas comuns no desenvolvimento e produção do OncoSaas.

## 📋 Índice

- [Problemas de Setup](#problemas-de-setup)
- [Problemas de Banco de Dados](#problemas-de-banco-de-dados)
- [Problemas de API](#problemas-de-api)
- [Problemas de WebSocket](#problemas-de-websocket)
- [Problemas de Autenticação](#problemas-de-autenticação)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas de Deployment](#problemas-de-deployment)
- [Logs e Debugging](#logs-e-debugging)

## Problemas de Setup

### ❌ Erro: `Cannot find module '@prisma/client'`

**Causa:** Prisma client não foi gerado após mudança no schema.

**Solução:**
```bash
cd backend
npx prisma generate
```

**Prevenção:** Sempre rodar após modificar `schema.prisma`:
```bash
npm run db:generate  # Alias configurado
```

---

### ❌ Erro: `Port 3000 already in use`

**Causa:** Porta já está sendo usada por outro processo.

**Solução:**

**Linux/Mac:**
```bash
# Encontrar processo
lsof -ti:3000

# Matar processo
kill -9 $(lsof -ti:3000)
```

**Windows:**
```bash
# Encontrar processo
netstat -ano | findstr :3000

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

**Alternativa:** Mudar porta no `.env`:
```bash
PORT=3002
```

---

### ❌ Erro: `ECONNREFUSED` ao conectar PostgreSQL

**Causa:** PostgreSQL não está rodando ou configuração incorreta.

**Solução:**

1. **Verificar se PostgreSQL está rodando:**
```bash
# Docker
docker ps | grep postgres

# Sistema (Linux)
sudo systemctl status postgresql

# Sistema (Mac)
brew services list | grep postgresql
```

2. **Iniciar PostgreSQL:**
```bash
# Docker
docker-compose up -d postgres

# Sistema
sudo systemctl start postgresql  # Linux
brew services start postgresql   # Mac
```

3. **Verificar `DATABASE_URL` no `.env`:**
```bash
# Formato correto
DATABASE_URL="postgresql://user:password@localhost:5432/oncosaas?schema=public"
```

4. **Testar conexão:**
```bash
psql $DATABASE_URL
```

---

### ❌ Erro: `Module not found: Can't resolve '@/...'`

**Causa:** Alias do TypeScript não configurado corretamente.

**Solução:**

**Frontend (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Backend (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**Reiniciar servidor de desenvolvimento após mudança.**

---

## Problemas de Banco de Dados

### ❌ Erro: `P2002: Unique constraint failed`

**Causa:** Tentativa de criar registro com valor duplicado em campo único.

**Exemplo comum:** Email já cadastrado.

**Solução:**

1. **Verificar se registro já existe antes de criar:**
```typescript
const existing = await prisma.user.findUnique({
  where: { email }
});

if (existing) {
  throw new ConflictException('Email já cadastrado');
}
```

2. **No frontend, tratar erro 409:**
```typescript
try {
  await createUser(data);
} catch (error) {
  if (error.response?.status === 409) {
    setError('Email já está em uso');
  }
}
```

---

### ❌ Erro: `P1001: Can't reach database server`

**Causa:** Banco de dados inacessível (offline, firewall, credenciais erradas).

**Solução:**

1. **Verificar se banco está rodando:**
```bash
docker ps | grep postgres
```

2. **Verificar credenciais no `.env`:**
```bash
echo $DATABASE_URL
```

3. **Testar conexão direta:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

4. **Verificar firewall (produção):**
```bash
telnet db-host 5432
```

5. **Verificar logs do PostgreSQL:**
```bash
docker logs <container-id>
```

---

### ❌ Migration falhando: `Column already exists`

**Causa:** Migration já foi aplicada manualmente ou schema está dessincronizado.

**Solução:**

1. **Reset completo (APENAS DEV!):**
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

2. **Produção (criar migration corretiva):**
```bash
# Fazer migration que verifica antes de adicionar
npx prisma migrate dev --create-only
# Editar SQL gerado para adicionar IF NOT EXISTS
npx prisma migrate deploy
```

---

### ❌ Query muito lenta

**Causa:** Falta de índices, N+1 queries, ou query ineficiente.

**Diagnóstico:**

1. **Habilitar log de queries:**
```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

2. **Usar EXPLAIN:**
```sql
EXPLAIN ANALYZE
SELECT * FROM patients WHERE tenant_id = 'xxx';
```

**Solução:**

1. **Adicionar índices:**
```prisma
model Patient {
  // ...
  @@index([tenantId])
  @@index([tenantId, priorityScore])
}
```

2. **Evitar N+1 com `include`:**
```typescript
// ❌ N+1
const patients = await prisma.patient.findMany();
for (const patient of patients) {
  patient.conversations = await prisma.conversation.findMany({
    where: { patientId: patient.id }
  });
}

// ✅ Correto
const patients = await prisma.patient.findMany({
  include: { conversations: true }
});
```

3. **Paginação:**
```typescript
const patients = await prisma.patient.findMany({
  take: 20,
  skip: (page - 1) * 20
});
```

---

## Problemas de API

### ❌ Erro 401: Unauthorized

**Causa:** Token JWT ausente, inválido ou expirado.

**Diagnóstico:**

```typescript
// Verificar token no frontend
const token = localStorage.getItem('accessToken');
console.log('Token:', token);

// Decodificar token (JWT.io)
const decoded = jwt.decode(token);
console.log('Expira em:', new Date(decoded.exp * 1000));
```

**Solução:**

1. **Token expirado → Refresh:**
```typescript
const refreshToken = async () => {
  const refresh = localStorage.getItem('refreshToken');
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refresh })
  });
  const { accessToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
};
```

2. **Implementar interceptor:**
```typescript
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await refreshToken();
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### ❌ Erro 403: Forbidden (tenant diferente)

**Causa:** Tentativa de acessar dados de outro tenant.

**Diagnóstico:**

```typescript
// Verificar tenantId no token
const token = jwt.decode(localStorage.getItem('accessToken'));
console.log('Meu tenant:', token.tenantId);

// Verificar tenantId do recurso
console.log('Tenant do paciente:', patient.tenantId);
```

**Solução:**

Garantir que todas as queries incluem `tenantId`:

```typescript
// ✅ Correto
const patient = await prisma.patient.findFirst({
  where: {
    id: patientId,
    tenantId: req.user.tenantId  // SEMPRE incluir
  }
});
```

---

### ❌ Erro 500: Internal Server Error

**Causa:** Erro não tratado no backend.

**Diagnóstico:**

1. **Verificar logs do backend:**
```bash
# Docker
docker logs <container-backend>

# Local
npm run start:dev
```

2. **Verificar Sentry (se configurado):**
```
https://sentry.io/organizations/oncosaas/issues/
```

**Solução:**

1. **Adicionar try/catch:**
```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  try {
    return await this.service.findOne(id);
  } catch (error) {
    this.logger.error('Error fetching patient', { error, id });
    throw new InternalServerErrorException('Failed to fetch patient');
  }
}
```

2. **Adicionar Exception Filter global:**
```typescript
// main.ts
app.useGlobalFilters(new AllExceptionsFilter());
```

---

### ❌ CORS Error no frontend

**Causa:** Backend não permite requisições do domínio do frontend.

**Solução:**

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://app.oncosaas.com'
  ],
  credentials: true
});
```

---

## Problemas de WebSocket

### ❌ WebSocket não conecta

**Causa:** URL incorreta, autenticação falhando, ou CORS.

**Diagnóstico:**

```typescript
const socket = io('http://localhost:3001', {
  auth: { token: accessToken },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => console.log('✅ Conectado'));
socket.on('connect_error', (err) => console.error('❌ Erro:', err.message));
```

**Solução:**

1. **Verificar URL e protocolo:**
```typescript
// HTTP → ws://
// HTTPS → wss://
const WS_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://api.oncosaas.com'
  : 'ws://localhost:3001';
```

2. **Verificar autenticação:**
```typescript
// Backend
@WebSocketGateway({ 
  cors: { origin: '*' },
  namespace: '/alerts'
})
export class AlertsGateway {
  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    // Validar token...
  }
}
```

3. **Testar com ferramenta:**
```bash
# Instalar wscat
npm install -g wscat

# Testar conexão
wscat -c ws://localhost:3001
```

---

### ❌ WebSocket desconecta frequentemente

**Causa:** Timeout, proxy, load balancer, ou instabilidade de rede.

**Solução:**

1. **Aumentar timeout:**
```typescript
const socket = io(url, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
  pingTimeout: 60000,
  pingInterval: 25000
});
```

2. **Configurar load balancer (produção):**
```nginx
# NGINX
location /socket.io/ {
  proxy_pass http://backend;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 86400;  # 24h
}
```

3. **Implementar heartbeat:**
```typescript
// Backend
@WebSocketGateway()
export class Gateway {
  @SubscribeMessage('ping')
  handlePing() {
    return 'pong';
  }
}

// Frontend
setInterval(() => {
  socket.emit('ping');
}, 25000);
```

---

## Problemas de Autenticação

### ❌ Login funciona mas usuário não persiste após reload

**Causa:** Token não está sendo salvo corretamente.

**Solução:**

```typescript
// Salvar no localStorage
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);

// Ou usar cookie httpOnly (mais seguro)
// Backend retorna cookie automaticamente
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dias
});
```

---

### ❌ Erro: `jwt malformed`

**Causa:** Token corrompido ou formato incorreto.

**Solução:**

```typescript
// Verificar se token está bem formatado
const token = localStorage.getItem('accessToken');
console.log('Token parts:', token?.split('.').length);  // Deve ser 3

// Se token inválido, limpar e redirecionar para login
if (!token || token.split('.').length !== 3) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  router.push('/login');
}
```

---

## Problemas de Performance

### ❌ Frontend lento ao listar pacientes

**Causa:** Renderização ineficiente, muitos dados, ou falta de virtualização.

**Solução:**

1. **Implementar paginação:**
```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['patients'],
  queryFn: ({ pageParam = 1 }) => fetchPatients(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextPage
});
```

2. **Virtualização de lista (react-window):**
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={patients.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <PatientCard patient={patients[index]} />
    </div>
  )}
</FixedSizeList>
```

3. **Memoização:**
```typescript
const PatientCard = memo(({ patient }) => {
  // ...
});
```

---

### ❌ Backend lento ao buscar dados

**Causa:** Queries ineficientes, N+1, ou falta de cache.

**Solução:**

1. **Adicionar cache (Redis):**
```typescript
@Injectable()
export class PatientsService {
  async findAll(tenantId: string) {
    const cached = await this.cache.get(`patients:${tenantId}`);
    if (cached) return cached;
    
    const patients = await this.prisma.patient.findMany({
      where: { tenantId }
    });
    
    await this.cache.set(`patients:${tenantId}`, patients, 300); // 5min
    return patients;
  }
}
```

2. **Otimizar queries:**
```typescript
// ❌ Busca tudo
const patients = await prisma.patient.findMany({
  include: { 
    conversations: {
      include: { messages: true }
    }
  }
});

// ✅ Seleciona apenas necessário
const patients = await prisma.patient.findMany({
  select: {
    id: true,
    name: true,
    priorityScore: true,
    conversations: {
      select: {
        id: true,
        status: true,
        lastMessageAt: true
      },
      take: 1,
      orderBy: { lastMessageAt: 'desc' }
    }
  }
});
```

---

## Problemas de Deployment

### ❌ Build falhando: `Out of memory`

**Causa:** Memória insuficiente durante build.

**Solução:**

```bash
# Aumentar memória do Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Dockerfile
FROM node:18-alpine
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

---

### ❌ Variáveis de ambiente não carregando em produção

**Causa:** `.env` não existe em produção ou não foi configurado no serviço.

**Solução:**

1. **Vercel:**
```bash
vercel env add DATABASE_URL production
```

2. **Railway:**
```bash
railway variables set DATABASE_URL=<value>
```

3. **Docker:**
```bash
docker run -e DATABASE_URL=<value> oncosaas-backend
```

---

### ❌ Migrations não rodando em produção

**Causa:** Migration não foi executada antes de iniciar aplicação.

**Solução:**

**Adicionar no script de start:**

```bash
# package.json
{
  "scripts": {
    "start:prod": "npx prisma migrate deploy && node dist/main"
  }
}
```

**Ou separar em CI/CD:**

```yaml
# GitHub Actions
- name: Run migrations
  run: |
    cd backend
    npx prisma migrate deploy

- name: Start application
  run: |
    cd backend
    npm start
```

---

## Logs e Debugging

### Habilitar logs detalhados

**Backend:**

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log', 'debug', 'verbose']
});
```

**Prisma:**

```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

**Frontend (React Query):**

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      onError: (error) => {
        console.error('React Query Error:', error);
      }
    }
  }
});
```

### Ferramentas de Debugging

**VSCode (Backend):**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

**Chrome DevTools (Frontend):**

```typescript
// Adicionar breakpoints no código
debugger;

// Ou usar console.trace()
console.trace('Stack trace aqui');
```

---

## Problemas Comuns por Sintoma

### 🐌 Sistema lento

1. Verificar queries no banco (N+1, sem índices)
2. Verificar cache (adicionar Redis)
3. Verificar tamanho de payloads (paginação)
4. Verificar renderizações desnecessárias (React Profiler)

### 🔌 Desconexões frequentes

1. Verificar timeout de WebSocket
2. Verificar configuração de proxy/load balancer
3. Implementar reconexão automática
4. Verificar limites de conexão do banco

### 🔒 Problemas de permissão

1. Verificar roles do usuário
2. Verificar Guards aplicados
3. Verificar tenantId em queries
4. Verificar JWT (payload correto)

### 💥 Crashes aleatórios

1. Verificar memória (memory leaks)
2. Verificar conexões não fechadas
3. Verificar unhandled promises
4. Adicionar error boundaries (React)

---

## Contatos de Suporte

**Desenvolvimento:**
- GitHub Issues: https://github.com/luizfiorimr/OncoSaas/issues

**Produção:**
- Email: support@oncosaas.com
- Slack: #oncosaas-tech

---

**Última atualização**: 2024-01-XX  
**Versão**: 1.0.0

Não encontrou seu problema? [Abra uma issue no GitHub](https://github.com/luizfiorimr/OncoSaas/issues).
