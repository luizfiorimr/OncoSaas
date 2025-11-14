# Funcionalidades de Conversa - Implementação Completa

**Data:** 2024-01-XX  
**Status:** ✅ Implementado  
**Componentes:** Frontend (React/Next.js) + Backend (NestJS) + WebSocket

---

## 📋 Resumo Executivo

Implementação completa do sistema de conversas WhatsApp no dashboard, permitindo que a equipe de enfermagem visualize mensagens, assuma conversas e envie respostas manualmente quando necessário.

---

## ✅ Funcionalidades Implementadas

### 1. **Visualização de Conversas**

- ✅ Lista de mensagens ordenada por timestamp
- ✅ Diferenciação visual entre mensagens do paciente, agente IA e enfermagem
- ✅ Exibição de informações do paciente (nome, tipo de câncer, estágio, score de prioridade)
- ✅ Timestamps formatados em português brasileiro

### 2. **Assumir Conversa (Handoff Manual)**

- ✅ Botão "Assumir Conversa" no componente `ConversationView`
- ✅ Hook `useAssumeMessage` para chamar API
- ✅ Endpoint `/messages/:id/assume` no backend
- ✅ Atualização automática do estado (`assumedBy`, `assumedAt`, `processedBy`)
- ✅ Atualização em tempo real via WebSocket

### 3. **Enviar Mensagem Manual**

- ✅ Campo de input para digitar mensagem
- ✅ Botão "Enviar" (habilitado apenas quando conversa está assumida)
- ✅ Hook `useSendMessage` com optimistic updates
- ✅ Endpoint `POST /messages` no backend
- ✅ Geração automática de `whatsappMessageId` e `whatsappTimestamp`
- ✅ Estado de loading durante envio ("Enviando...")

### 4. **Atualizações em Tempo Real (WebSocket)**

- ✅ Hook `useMessagesSocket` para escutar eventos
- ✅ Inscrição automática na room do paciente (`subscribe_patient_messages`)
- ✅ Eventos escutados:
  - `new_message`: Nova mensagem recebida
  - `message_updated`: Mensagem atualizada (assumida, etc.)
  - `message_sent`: Confirmação de envio
- ✅ Atualização automática do cache do React Query
- ✅ Desinscrição automática ao desmontar componente

### 5. **Permissões e Segurança**

- ✅ Backend permite `NURSE` e `ONCOLOGIST` criar mensagens
- ✅ `assumedBy` preenchido automaticamente quando `processedBy === 'NURSING'`
- ✅ Isolamento multi-tenant (todas as queries incluem `tenantId`)
- ✅ Autenticação JWT obrigatória no WebSocket

---

## 🏗️ Arquitetura

### Frontend

```
DashboardPage
  ├── useMessages(patientId) → Busca mensagens do paciente
  ├── useMessagesSocket(patientId) → Escuta atualizações em tempo real
  ├── useSendMessage() → Envia mensagem manual
  └── useAssumeMessage() → Assume conversa
```

### Backend

```
MessagesController
  ├── GET /messages?patientId=xxx → Lista mensagens
  ├── POST /messages → Cria mensagem (enviar manual)
  └── PATCH /messages/:id/assume → Assume conversa

MessagesService
  ├── create() → Cria mensagem + emite evento WebSocket
  └── assumeConversation() → Atualiza mensagem + emite evento WebSocket

MessagesGateway
  ├── emitNewMessage() → Emite para tenant + room do paciente
  ├── emitMessageSent() → Emite confirmação de envio
  └── emitMessageUpdate() → Emite atualização (assumida)
```

---

## 🔄 Fluxos Implementados

### Fluxo 1: Visualizar Conversa

```
1. Usuário seleciona paciente na lista
   ↓
2. DashboardPage busca mensagens (useMessages)
   ↓
3. ConversationView renderiza mensagens
   ↓
4. useMessagesSocket inscreve-se na room do paciente
   ↓
5. Novas mensagens chegam automaticamente via WebSocket
```

### Fluxo 2: Assumir Conversa

```
1. Enfermeiro clica "Assumir Conversa"
   ↓
2. handleTakeOver() encontra última mensagem não assumida
   ↓
3. useAssumeMessage.mutateAsync(messageId)
   ↓
4. Backend atualiza mensagem (assumedBy, assumedAt, processedBy)
   ↓
5. Backend emite evento 'message_updated' via WebSocket
   ↓
6. Frontend atualiza cache automaticamente
   ↓
7. isNursingActive = true → Input habilitado
```

### Fluxo 3: Enviar Mensagem Manual

```
1. Enfermeiro digita mensagem e clica "Enviar"
   ↓
2. handleSendMessage() chama useSendMessage.mutateAsync()
   ↓
3. Optimistic update: mensagem temporária aparece imediatamente
   ↓
4. Backend cria mensagem no banco
   ↓
5. Backend emite evento 'message_sent' via WebSocket
   ↓
6. Frontend substitui mensagem temporária por mensagem real
```

---

## 📁 Arquivos Criados/Modificados

### Frontend

**Novos:**

- `frontend/src/hooks/useMessagesSocket.ts` - Hook para WebSocket de mensagens
- `frontend/src/lib/api/messages.ts` - Adicionado método `send()`

**Modificados:**

- `frontend/src/hooks/useMessages.ts` - Adicionados `useSendMessage` e melhorado `useAssumeMessage`
- `frontend/src/app/chat/page.tsx` - Integração dos hooks e handlers
- `frontend/src/components/dashboard/conversation-view.tsx` - Adicionada prop `isSending`

### Backend

**Modificados:**

- `backend/src/messages/messages.controller.ts` - Permissões ajustadas para `NURSE` e `ONCOLOGIST`
- `backend/src/gateways/messages.gateway.ts` - Emissão para rooms específicas de pacientes

---

## 🧪 Como Testar

### 1. Assumir Conversa

1. Faça login como enfermeiro (`nurse@hospitalteste.com` / `senha123`)
2. Selecione um paciente com mensagens
3. Clique em "Assumir Conversa"
4. Verifique que o input fica habilitado
5. Verifique no backend que a mensagem foi atualizada (`assumedBy`, `assumedAt`)

### 2. Enviar Mensagem Manual

1. Após assumir conversa, digite uma mensagem
2. Clique em "Enviar"
3. Verifique que a mensagem aparece imediatamente (optimistic update)
4. Verifique no backend que a mensagem foi criada
5. Verifique que a mensagem temporária foi substituída pela real

### 3. Atualizações em Tempo Real

1. Abra o dashboard em duas abas diferentes
2. Em uma aba, envie uma mensagem manual
3. Verifique que a outra aba atualiza automaticamente
4. Verifique no console do navegador os eventos WebSocket

---

## 🔍 Pontos de Atenção

### 1. **ConversationId**

- Atualmente, o `conversationId` é obtido da primeira mensagem
- Se não houver mensagens, será `undefined` (nova conversa)
- Em produção, o `conversationId` deve ser gerenciado pelo sistema de WhatsApp

### 2. **WhatsApp Message ID**

- Atualmente gerado no frontend (`msg_${timestamp}_${random}`)
- Em produção, deve vir do WhatsApp Business API após envio real

### 3. **Optimistic Updates**

- Mensagens temporárias têm ID começando com `temp-`
- São substituídas quando a mensagem real chega do servidor
- Em caso de erro, o estado é revertido automaticamente

### 4. **WebSocket Rooms**

- Clientes se inscrevem em `patient:${patientId}:tenant:${tenantId}`
- Gateway emite para tenant inteiro + room específica do paciente
- Isso permite notificações globais e específicas

---

## 🚀 Próximos Passos

### Melhorias Sugeridas

1. **Feedback Visual:**
   - Toast notifications para sucesso/erro
   - Indicador de "digitando..." quando paciente está digitando
   - Badge de "não lida" nas mensagens

2. **Funcionalidades Avançadas:**
   - Histórico de conversas (paginado)
   - Busca dentro da conversa
   - Anexos (imagens, documentos)
   - Mensagens de voz (áudio)

3. **Otimizações:**
   - Debounce no envio de mensagens
   - Virtualização da lista de mensagens (para conversas longas)
   - Cache mais inteligente (não invalidar tudo)

4. **Integração WhatsApp Real:**
   - Conectar com WhatsApp Business API
   - Enviar mensagens reais via API
   - Receber webhooks do WhatsApp

---

## 📚 Referências

- [Documentação WebSocket](./realtime-updates.md)
- [Arquitetura da Conversa](./../arquitetura/frontend-conversa.md)
- [API Messages](../api/messages-endpoints.md)

---

**Última atualização:** 2024-01-XX
