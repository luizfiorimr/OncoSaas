# 🔐 Armazenamento de Tokens e Chaves do Facebook

## Visão Geral

Quando o usuário completa a integração do WhatsApp via **Embedded Signup**, o Facebook retorna um **código** que é trocado por um **business token** no servidor. Este token e outras informações sensíveis são **criptografados** antes de serem armazenados no banco de dados.

## Fluxo de Armazenamento

### 1. Embedded Signup Flow

```
Frontend (FB.login)
  → Recebe: code (código trocável)
  → Envia para Backend: POST /embedded-signup/process { code }
```

### 2. Backend Processa o Código

```typescript
// backend/src/whatsapp-connections/whatsapp-connections.service.ts

async processEmbeddedSignup(code: string, tenantId: string) {
  // 1. Trocar código por business token
  const businessToken = await exchangeCodeForBusinessToken(code);

  // 2. Buscar recursos da Meta
  const businesses = await getBusinessManagers(businessToken);
  const whatsappAccounts = await getWhatsAppBusinessAccounts(...);
  const phoneNumbers = await getPhoneNumbers(...);

  // 3. Criptografar e armazenar
  await prisma.whatsAppConnection.create({
    oauthAccessToken: encryptSensitiveData(businessToken, encryptionKey),
    // ... outros campos
  });
}
```

## Dados Armazenados

### Modelo `WhatsAppConnection` (Prisma)

```prisma
model WhatsAppConnection {
  // Identificação
  name            String    // Nome descritivo
  phoneNumber     String    // Número de telefone
  phoneNumberId   String?   // ID do número na Meta
  whatsappBusinessAccountId String? // ID da WABA
  businessAccountId String? // ID da Business Manager

  // OAuth (preferencial) - CRIPTOGRAFADO
  oauthAccessToken String?  // Business token - Criptografado (AES-256-GCM)
  oauthRefreshToken String? // Refresh token - Criptografado (não usado atualmente)
  oauthExpiresAt  DateTime? // Data de expiração (60 dias)
  oauthScopes     String[]  // Escopos concedidos

  // Status
  status          WhatsAppConnectionStatus
  isActive        Boolean
  isDefault       Boolean
  lastSyncAt      DateTime?
  lastError       String?
  metadata        Json?     // Dados adicionais
}
```

## Criptografia

### Algoritmo: AES-256-GCM

**Características:**

- **Algoritmo**: AES-256-GCM (Galois/Counter Mode)
- **Derivação de chave**: PBKDF2 com 100.000 iterações
- **Hash**: SHA-512
- **Salt**: 64 bytes (aleatório por criptografia)
- **IV**: 16 bytes (aleatório por criptografia)
- **Tag de autenticação**: 16 bytes (GCM)

### Função de Criptografia

```typescript
// backend/src/whatsapp-connections/utils/encryption.util.ts

export function encryptSensitiveData(text: string, key: string): string {
  // 1. Gerar salt e IV aleatórios
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);

  // 2. Derivar chave usando PBKDF2
  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha512');

  // 3. Criptografar com AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  // 4. Obter tag de autenticação
  const tag = cipher.getAuthTag();

  // 5. Concatenar: salt + iv + tag + encrypted (base64)
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}
```

### Chave de Criptografia

A chave de criptografia é armazenada na variável de ambiente:

```env
ENCRYPTION_KEY=default-key-change-in-production-32-bytes!!
```

**⚠️ IMPORTANTE**: Em produção, use uma chave forte de 32 bytes gerada aleatoriamente!

## Dados Armazenados por Campo

### 1. `oauthAccessToken` (Criptografado)

**Conteúdo**: Business token do Facebook (long-lived token)

**Formato Original**:

```
EAABsbCS1iHgBO4r3Ddh7mDmCOiftKkK9TU1BjLPgGqVLv83HApiVPtC6zEiml9LZB3xXS7ZAorcx6OjZA9bhgn2cBnvMBsp2zd7HBVbx8mqHZCymZCAZCrjlZB1pcZBRlOlwWDD6Y5MPPE3pxHYyjkl6XTNdWTsrKe00EdK6Vjny8ZCbxJNIVKqyBXX01YN3ZCUeqQdod2uyuwpQGJ65Pg
```

**Formato Armazenado** (criptografado):

```
base64(salt + iv + tag + encrypted_data)
```

**Validade**: 60 dias (configurado em `oauthExpiresAt`)

**Uso**: Usado para fazer chamadas à Graph API do Facebook

### 2. `phoneNumberId` (Não Criptografado)

**Conteúdo**: ID do número de telefone na Meta

**Exemplo**: `123456789012345`

**Uso**: Usado para enviar mensagens via WhatsApp Business API

### 3. `whatsappBusinessAccountId` (Não Criptografado)

**Conteúdo**: ID da conta WhatsApp Business na Meta

**Exemplo**: `987654321098765`

**Uso**: Usado para buscar números de telefone e configurar webhooks

### 4. `businessAccountId` (Não Criptografado)

**Conteúdo**: ID da Business Manager na Meta

**Exemplo**: `456789012345678`

**Uso**: Usado para buscar WhatsApp Business Accounts

### 5. `oauthScopes` (Array de Strings)

**Conteúdo**: Escopos concedidos pelo usuário

**Valores**:

```typescript
[
  'business_management',
  'whatsapp_business_management',
  'whatsapp_business_messaging',
];
```

### 6. `oauthExpiresAt` (DateTime)

**Conteúdo**: Data de expiração do token

**Cálculo**: `Date.now() + 60 * 24 * 60 * 60 * 1000` (60 dias)

**Uso**: Verificar se o token ainda é válido antes de usar

## Segurança

### ✅ Boas Práticas Implementadas

1. **Criptografia em Repouso**: Todos os tokens sensíveis são criptografados antes de salvar no banco
2. **Algoritmo Forte**: AES-256-GCM com autenticação
3. **Salt Único**: Cada criptografia usa um salt diferente
4. **Derivação de Chave**: PBKDF2 com 100.000 iterações
5. **Multi-Tenancy**: Tokens isolados por `tenantId`
6. **Validação de Expiração**: Verificação de `oauthExpiresAt` antes de usar

### ⚠️ Pontos de Atenção

1. **Chave de Criptografia**: Deve ser mantida segura e nunca commitada no Git
2. **Rotação de Tokens**: Tokens expiram em 60 dias - precisa implementar refresh
3. **Backup da Chave**: Se perder a `ENCRYPTION_KEY`, não será possível descriptografar tokens antigos
4. **Logs**: Nunca logar tokens descriptografados

## Uso dos Tokens

### Descriptografar Token para Uso

```typescript
// backend/src/whatsapp-connections/whatsapp-connections.service.ts

async getAccessToken(connectionId: string): Promise<string> {
  const connection = await prisma.whatsAppConnection.findUnique({
    where: { id: connectionId }
  });

  // Verificar expiração
  if (connection.oauthExpiresAt && connection.oauthExpiresAt < new Date()) {
    throw new BadRequestException('Token expired');
  }

  // Descriptografar
  return decryptSensitiveData(
    connection.oauthAccessToken,
    this.encryptionKey
  );
}
```

### Usar Token para Chamadas à API

```typescript
// Exemplo: Buscar informações do número
const accessToken = await this.getAccessToken(connectionId);
const response = await axios.get(
  `https://graph.facebook.com/v18.0/${phoneNumberId}`,
  {
    params: { access_token: accessToken },
  }
);
```

## Refresh Token (Não Implementado)

Atualmente, **não estamos usando refresh tokens**. Quando o token expira (60 dias), o usuário precisa reconectar.

**Futuro**: Implementar renovação automática usando refresh token (se disponível na Meta API).

## Auditoria e Logs

### O que NÃO logar:

- ❌ Tokens descriptografados
- ❌ Chaves de criptografia
- ❌ App Secrets

### O que PODE logar:

- ✅ IDs de conexão
- ✅ Status da conexão
- ✅ Datas de expiração (sem o token)
- ✅ Erros genéricos (sem detalhes do token)

## Exemplo de Dados no Banco

```json
{
  "id": "uuid-123",
  "tenantId": "tenant-abc",
  "name": "WhatsApp Oncologia",
  "phoneNumber": "+5511999999999",
  "phoneNumberId": "123456789012345",
  "whatsappBusinessAccountId": "987654321098765",
  "businessAccountId": "456789012345678",
  "authMethod": "OAUTH",
  "oauthAccessToken": "U2FsdGVkX1+vupppZksvRf5pq5g5XkFy...", // Criptografado
  "oauthExpiresAt": "2024-01-15T10:30:00Z",
  "oauthScopes": [
    "business_management",
    "whatsapp_business_management",
    "whatsapp_business_messaging"
  ],
  "status": "CONNECTED",
  "isActive": true,
  "isDefault": true
}
```

## Variáveis de Ambiente Relacionadas

```env
# Chave de criptografia (32 bytes mínimo)
ENCRYPTION_KEY=your-32-byte-encryption-key-change-in-production!!

# Meta App Credentials (usadas para trocar código por token)
META_APP_ID=980766987152980
META_APP_SECRET=ecce4e7ce182fb6bdce4e5893fa3efe6
```

## Referências

- [Meta Graph API - Access Tokens](https://developers.facebook.com/docs/graph-api/overview#access-tokens)
- [WhatsApp Embedded Signup](https://developers.facebook.com/docs/whatsapp/embedded-signup/)
- [Node.js Crypto - AES-256-GCM](https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options)
