# Setup do Frontend - MEDSAAS

## Estrutura Criada

### 📁 Cliente de API (`src/lib/api/`)

- **`client.ts`**: Cliente HTTP baseado em Axios com interceptors para JWT e tenantId
- **`auth.ts`**: API de autenticação (login, register, logout)
- **`patients.ts`**: API de pacientes (CRUD completo)
- **`messages.ts`**: API de mensagens WhatsApp
- **`alerts.ts`**: API de alertas
- **`observations.ts`**: API de observações clínicas (FHIR)

### 📁 Stores (`src/stores/`)

- **`auth-store.ts`**: Store Zustand para gerenciamento de autenticação
  - Estado: `user`, `token`, `isAuthenticated`
  - Métodos: `login()`, `logout()`, `initialize()`

### 📁 Hooks (`src/hooks/`)

- **`usePatients.ts`**: Hooks React Query para pacientes
  - `usePatients()`: Listar todos
  - `usePatient(id)`: Obter por ID
  - `useCreatePatient()`, `useUpdatePatient()`, `useDeletePatient()`

- **`useAlerts.ts`**: Hooks React Query para alertas
  - `useAlerts(status?)`: Listar alertas
  - `useAcknowledgeAlert()`, `useResolveAlert()`, `useDismissAlert()`

- **`useMessages.ts`**: Hooks React Query para mensagens
  - `useMessages(patientId?)`: Listar mensagens
  - `useUnassumedMessagesCount()`: Contar não assumidas
  - `useAssumeMessage()`: Assumir mensagem

- **`useSocket.ts`**: Hook para conexão WebSocket
- **`useAlertsSocket.ts`**: Hook específico para alertas em tempo real

### 📁 Componentes (`src/components/`)

- **`dashboard/patient-list-connected.tsx`**: Lista de pacientes conectada à API
- **`dashboard/alerts-panel.tsx`**: Painel de alertas pendentes
- **`ui/button.tsx`**: Componente Button (shadcn/ui)

### 📁 Páginas (`src/app/`)

- **`(auth)/login/page.tsx`**: Página de login
- **`chat/page.tsx`**: Chat principal conectado ao backend
- **`providers.tsx`**: Provider do React Query
- **`layout.tsx`**: Layout raiz com Providers
- **`middleware.ts`**: Middleware de autenticação

## Funcionalidades Implementadas

### ✅ Autenticação

- Login com email/senha
- Armazenamento de token no localStorage
- Redirecionamento automático (login ↔ chat)
- Logout

### ✅ Chat

- Lista de pacientes (conectada à API)
- Painel de alertas pendentes
- Visualização de conversas por paciente
- Contador de mensagens não assumidas
- Header com informações do usuário

### ✅ Integração com Backend

- Todos os endpoints principais conectados
- Tratamento de erros
- Loading states
- Cache com React Query

## Como Testar

### 1. Iniciar Backend

```bash
cd backend
npm run start:dev
```

### 2. Iniciar Frontend

```bash
cd frontend
npm run dev
```

### 3. Acessar Aplicação

- Abrir: http://localhost:3000
- Será redirecionado para `/login`
- Login: `admin@hospitalteste.com` / `senha123`
- Será redirecionado para `/chat`

## Próximos Passos

1. ✅ Cliente de API criado
2. ✅ Autenticação implementada
3. ✅ Chat básico conectado
4. ⏳ Melhorar UI/UX do chat
5. ⏳ Implementar busca de pacientes
6. ⏳ Implementar filtros (prioridade, status)
7. ⏳ Implementar WebSocket para atualizações em tempo real
8. ⏳ Criar página de detalhes do paciente
9. ⏳ Implementar envio de mensagens manual

## Dependências Instaladas

- `axios`: Cliente HTTP
- `@tanstack/react-query`: Gerenciamento de estado do servidor
- `zustand`: Gerenciamento de estado global
- `socket.io-client`: WebSocket client
- `date-fns`: Formatação de datas
- `lucide-react`: Ícones

## Configurações

### TypeScript (`tsconfig.json`)

- Path alias `@/*` configurado para `./src/*`

### Next.js (`next.config.js`)

- Variáveis de ambiente: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

### Middleware (`middleware.ts`)

- Proteção de rotas
- Redirecionamento automático baseado em autenticação
