# 🚀 Quick Start - OncoSaas

Guia rápido para começar a usar o OncoSaas em 5 minutos.

---

## Pré-requisitos

Certifique-se de ter completado a [Instalação](./INSTALLATION.md).

---

## Início Rápido

### 1. Iniciar Todos os Serviços

```bash
# Terminal 1 - Infraestrutura
docker compose up -d

# Terminal 2 - Backend
cd backend && npm run start:dev

# Terminal 3 - Frontend
cd frontend && npm run dev
```

### 2. Acessar o Sistema

Abra o navegador em: **http://localhost:3000**

### 3. Fazer Login

Use as credenciais de teste:
- **Email**: `admin@hospitalteste.com`
- **Senha**: `senha123`

---

## Tour Pelo Sistema

### Dashboard Principal

Após login, você verá:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Dashboard                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pacientes  │  │   Conversas  │  │   Alertas    │          │
│  │     150      │  │      45      │  │      3 🔴    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Lista de Pacientes Priorizados                          │   │
│  │                                                          │   │
│  │ 🔴 Maria Silva - Dor intensa (Score: 85)                │   │
│  │ 🟠 João Santos - Exame atrasado (Score: 72)             │   │
│  │ 🟡 Ana Costa - Follow-up pendente (Score: 55)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Páginas Disponíveis

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard principal com métricas |
| `/patients` | Lista de todos os pacientes |
| `/patients/[id]` | Detalhes de um paciente |
| `/chat` | Interface de conversas WhatsApp |
| `/oncology-navigation` | Navegação oncológica |
| `/users` | Gestão de usuários (admin) |
| `/integrations` | Configurações de integração |

---

## Funcionalidades Principais

### 📋 Gestão de Pacientes

1. Acesse **Pacientes** no menu lateral
2. Veja a lista com priorização por score
3. Clique em um paciente para ver detalhes
4. Use os filtros para buscar pacientes específicos

**Ações disponíveis**:
- ✅ Criar novo paciente
- ✅ Editar dados do paciente
- ✅ Ver histórico de mensagens
- ✅ Ver jornada de navegação

### 💬 Conversas WhatsApp

1. Acesse **Chat** no menu lateral
2. Selecione um paciente na lista
3. Veja o histórico de mensagens
4. Envie mensagens (quando WhatsApp configurado)

**Recursos**:
- 📩 Mensagens em tempo real (WebSocket)
- 🤖 Indicação de respostas do agente IA
- 📎 Suporte a mídia (áudio, imagens)

### 🚨 Sistema de Alertas

1. Veja alertas críticos no dashboard
2. Clique para ver detalhes do paciente
3. Tome ação e resolva o alerta

**Tipos de alertas**:
- 🔴 **Critical**: Sintomas graves, ação imediata
- 🟠 **High**: Exame atrasado, follow-up urgente
- 🟡 **Medium**: Etapa pendente
- 🟢 **Low**: Informativo

### 🧭 Navegação Oncológica

1. Acesse **Navegação Oncológica**
2. Veja pacientes em cada estágio
3. Acompanhe progresso das etapas
4. Atualize status das etapas

**Estágios da jornada**:
```
SCREENING → DIAGNOSIS → TREATMENT → FOLLOW_UP
```

---

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl + K` | Busca rápida |
| `Ctrl + N` | Novo paciente |
| `Esc` | Fechar modal |

---

## API Rápida

### Testar com cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospitalteste.com","password":"senha123"}' \
  | jq -r '.access_token')

# Listar pacientes
curl http://localhost:3001/patients \
  -H "Authorization: Bearer $TOKEN"

# Ver métricas do dashboard
curl http://localhost:3001/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN"
```

### Usando JavaScript

```javascript
// Login
const response = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@hospitalteste.com',
    password: 'senha123'
  })
});
const { access_token } = await response.json();

// Listar pacientes
const patients = await fetch('http://localhost:3001/patients', {
  headers: { Authorization: `Bearer ${access_token}` }
}).then(r => r.json());
```

---

## Ferramentas de Desenvolvimento

### Prisma Studio (Visualizar Banco)

```bash
cd backend
npm run prisma:studio
```

Acesse: **http://localhost:5555**

### Swagger (Documentação API)

Se configurado, acesse: **http://localhost:3001/api/docs**

### Health Check

```bash
# Backend
curl http://localhost:3001/health

# AI Service (se rodando)
curl http://localhost:8000/health
```

---

## Cenários de Teste

### Cenário 1: Criar Paciente

1. Vá para **Pacientes**
2. Clique em **Novo Paciente**
3. Preencha os dados:
   - Nome: "Teste da Silva"
   - Telefone: "+5511999998888"
   - Data de nascimento
   - Gênero
4. Salve e veja o paciente na lista

### Cenário 2: Iniciar Navegação

1. Vá para **Navegação Oncológica**
2. Selecione um paciente sem jornada
3. Clique em **Iniciar Jornada**
4. Selecione tipo de câncer (ex: Colorretal)
5. Veja as etapas criadas automaticamente

### Cenário 3: Resolver Alerta

1. No Dashboard, veja alertas críticos
2. Clique no alerta
3. Revise informações do paciente
4. Clique em **Resolver**
5. Adicione nota de resolução

---

## Dicas

### Performance

- Use filtros para reduzir dados carregados
- O sistema usa cache (React Query) automaticamente
- WebSocket mantém dados atualizados em tempo real

### Debug

```bash
# Logs do backend
cd backend && npm run start:dev

# Logs do frontend (em outra janela)
cd frontend && npm run dev

# Ver queries SQL
DEBUG="prisma:query" npm run start:dev
```

### Resetar Dados de Teste

```bash
cd backend

# Resetar banco e recarregar seed
npm run prisma:reset
```

---

## Próximos Passos

1. ✅ Tour pelo sistema completo
2. 📖 Leia a [Documentação da API](./API.md)
3. 🏗️ Entenda a [Arquitetura](./ARCHITECTURE.md)
4. 🔧 Configure [WhatsApp Integration](../README-HTTPS.md)
5. 🤝 Veja como [Contribuir](../CONTRIBUTING.md)

---

## Precisa de Ajuda?

- 📚 [Documentação Completa](./README.md)
- 🐛 [Reportar Bug](https://github.com/luizfiorimr/OncoSaas/issues)
- 💬 [Discussões](https://github.com/luizfiorimr/OncoSaas/discussions)
