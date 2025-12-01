# 🔒 Guia de Segurança - OncoSaas

Este documento descreve as práticas de segurança implementadas no OncoSaas e diretrizes para reportar vulnerabilidades.

## 📋 Índice

- [Arquitetura de Segurança](#arquitetura-de-segurança)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Multi-Tenancy e Isolamento de Dados](#multi-tenancy-e-isolamento-de-dados)
- [Criptografia](#criptografia)
- [Proteção de API](#proteção-de-api)
- [Auditoria e Logging](#auditoria-e-logging)
- [Segurança de Dados Sensíveis](#segurança-de-dados-sensíveis)
- [Compliance (LGPD/HIPAA)](#compliance-lgpdhipaa)
- [Reportar Vulnerabilidades](#reportar-vulnerabilidades)

## Arquitetura de Segurança

### Camadas de Proteção

```
┌─────────────────────────────────────────────┐
│  Camada 1: Network Security                │
│  - Firewall (AWS Security Groups)          │
│  - DDoS Protection (CloudFlare)             │
│  - Rate Limiting (API Gateway)              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 2: Application Security             │
│  - JWT Authentication                       │
│  - RBAC Authorization                       │
│  - Input Validation (class-validator)      │
│  - CORS Protection                          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 3: Data Security                    │
│  - Multi-Tenancy (schema isolation)         │
│  - Encryption at Rest (AES-256)             │
│  - Encryption in Transit (TLS 1.3)          │
│  - Database Access Control                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Camada 4: Monitoring & Audit               │
│  - Audit Logs (immutable)                   │
│  - Security Monitoring (Sentry)             │
│  - Intrusion Detection                      │
└─────────────────────────────────────────────┘
```

### Princípios de Segurança

1. **Defense in Depth**: Múltiplas camadas de segurança
2. **Least Privilege**: Usuários/sistemas têm apenas permissões necessárias
3. **Zero Trust**: Sempre validar, nunca assumir confiança
4. **Fail Secure**: Em caso de erro, negar acesso por padrão
5. **Audit Everything**: Registrar todas as ações para auditoria

## Autenticação e Autorização

### JWT (JSON Web Tokens)

**Implementação:**

```typescript
// backend/src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    // Validar credenciais
    const user = await this.validateUser(credentials);
    
    // Gerar tokens
    const accessToken = this.jwtService.sign(
      { 
        sub: user.id, 
        email: user.email,
        tenantId: user.tenantId,
        roles: user.roles 
      },
      { expiresIn: '15m' }  // Access token: 15 minutos
    );
    
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: '7d' }  // Refresh token: 7 dias
    );
    
    return { accessToken, refreshToken, user };
  }
}
```

**Características:**

- ✅ Access Token: 15 minutos (curta duração)
- ✅ Refresh Token: 7 dias (rotação automática)
- ✅ Payload inclui: `userId`, `email`, `tenantId`, `roles`
- ✅ Assinado com `HS256` (symmetric) ou `RS256` (asymmetric)
- ✅ Armazenado no cliente: `httpOnly` cookie (mais seguro) ou `localStorage` (convenience)

### RBAC (Role-Based Access Control)

**Roles Definidas:**

```typescript
export enum UserRole {
  ADMIN = 'admin',          // Acesso total ao sistema
  ONCOLOGIST = 'oncologist', // Acesso clínico completo
  NURSE = 'nurse',          // Acesso a navegação e alertas
  COORDINATOR = 'coordinator', // Acesso a métricas e gestão
}
```

**Implementação:**

```typescript
// backend/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    );
    
    if (!requiredRoles) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// Uso em controllers
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  @Get()
  @Roles(UserRole.NURSE, UserRole.ONCOLOGIST, UserRole.ADMIN)
  async findAll() { /* ... */ }
  
  @Delete(':id')
  @Roles(UserRole.ADMIN)  // Apenas admin pode deletar
  async remove(@Param('id') id: string) { /* ... */ }
}
```

### Multi-Factor Authentication (MFA)

**Recomendação:** Obrigatório para usuários com roles críticas (`ONCOLOGIST`, `ADMIN`).

**Implementação (TOTP - Time-based One-Time Password):**

```typescript
// backend/src/modules/auth/mfa.service.ts
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

@Injectable()
export class MfaService {
  async generateSecret(userId: string): Promise<MfaSetup> {
    const secret = speakeasy.generateSecret({
      name: `OncoSaas (${userId})`,
      issuer: 'OncoSaas'
    });
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    
    // Salvar secret criptografado no banco
    await this.saveEncryptedSecret(userId, secret.base32);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl
    };
  }
  
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const secret = await this.getDecryptedSecret(userId);
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1  // Aceita 1 intervalo antes/depois (±30s)
    });
  }
}
```

## Multi-Tenancy e Isolamento de Dados

### Schema por Tenant

**Estratégia:** Cada tenant (hospital/clínica) tem seu próprio schema no PostgreSQL.

**Vantagens:**

- ✅ Isolamento forte de dados
- ✅ Backup/restore por tenant
- ✅ Migrações independentes
- ✅ Sem risco de vazamento de dados entre tenants

**Implementação:**

```typescript
// backend/src/common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Tenant ID not found');
    }
    
    // Configurar schema para este request
    request.tenantId = user.tenantId;
    
    return true;
  }
}

// Middleware para injetar tenantId em todas as queries
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      // Middleware global
      middleware: [
        async (params, next) => {
          // Inject tenantId em todas as queries
          if (params.model && params.args?.where) {
            if (!params.args.where.tenantId) {
              throw new Error('TenantId is required in all queries');
            }
          }
          return next(params);
        }
      ]
    });
  }
}
```

**Regra Crítica:** **TODAS** as queries devem incluir `tenantId`.

```typescript
// ✅ CORRETO
const patients = await prisma.patient.findMany({
  where: { 
    tenantId: req.user.tenantId,  // SEMPRE presente
    status: 'ACTIVE' 
  }
});

// ❌ ERRADO - Faltou tenantId (pode vazar dados!)
const patients = await prisma.patient.findMany({
  where: { status: 'ACTIVE' }
});
```

### Validação de Acesso por Tenant

```typescript
// backend/src/modules/patients/patients.service.ts
@Injectable()
export class PatientsService {
  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      where: { 
        id, 
        tenantId  // Validação crítica
      }
    });
    
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    
    return patient;
  }
}
```

## Criptografia

### Em Trânsito (TLS 1.3)

**HTTPS Obrigatório:**

```typescript
// backend/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  if (process.env.NODE_ENV === 'production') {
    // Forçar HTTPS em produção
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }
  
  await app.listen(3001);
}
```

**Certificados SSL:**

- Produção: Let's Encrypt (automático via Certbot) ou AWS Certificate Manager
- Desenvolvimento: Self-signed (apenas para teste)

### Em Repouso (AES-256)

**Dados Sensíveis Criptografados:**

- Senhas (bcrypt)
- Conversas WhatsApp
- Dados de saúde específicos (conforme necessidade)

**Implementação:**

```typescript
// backend/src/common/utils/encryption.util.ts
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Retornar: iv + authTag + encrypted
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

export const decrypt = (encrypted: string): string => {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

**Uso:**

```typescript
// Salvar conversa criptografada
const encryptedContent = encrypt(conversationData);
await prisma.conversation.create({
  data: {
    content: encryptedContent,
    tenantId
  }
});

// Ler conversa
const conversation = await prisma.conversation.findFirst({ /* ... */ });
const decryptedContent = decrypt(conversation.content);
```

### Senhas (bcrypt)

```typescript
import * as bcrypt from 'bcrypt';

// Criar hash (ao registrar)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Verificar (ao fazer login)
const isMatch = await bcrypt.compare(password, user.hashedPassword);
```

**Características:**

- ✅ Salt aleatório por senha
- ✅ Custo de trabalho: 10 rounds (ajustável)
- ✅ Resistente a rainbow tables e brute-force

## Proteção de API

### Rate Limiting

**Implementação:**

```typescript
// backend/src/main.ts
import * as rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

// Rate limit específico para login (evitar brute-force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas de login por IP
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', loginLimiter);
```

### CORS (Cross-Origin Resource Sharing)

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3000',              // Dev
    'https://app.oncosaas.com',          // Produção
    'https://staging.oncosaas.com'       // Staging
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

### Input Validation

**Class-validator (NestJS):**

```typescript
// backend/src/modules/patients/dto/create-patient.dto.ts
import { IsString, IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
  
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  // ... outros campos com validações
}
```

**Sanitização:**

```typescript
import { sanitize } from 'class-sanitizer';

// Remove HTML/scripts de inputs
@Transform(({ value }) => sanitize(value))
description: string;
```

### SQL Injection Prevention

**Prisma ORM:** Usa prepared statements automaticamente.

```typescript
// ✅ SEGURO - Prisma usa prepared statements
const user = await prisma.user.findFirst({
  where: { email: userInput }
});

// ❌ NUNCA fazer queries raw com input do usuário!
await prisma.$executeRaw(`SELECT * FROM users WHERE email = '${userInput}'`);
```

### XSS (Cross-Site Scripting) Prevention

**Frontend:**

- React escapa valores por padrão
- Nunca usar `dangerouslySetInnerHTML` sem sanitizar

**Backend:**

```typescript
import * as xss from 'xss';

// Sanitizar HTML
const sanitizedInput = xss(userInput);
```

## Auditoria e Logging

### Audit Logs

**Eventos Auditados:**

- ✅ Login/Logout
- ✅ Criação/Modificação/Exclusão de pacientes
- ✅ Acesso a dados sensíveis
- ✅ Mudanças de configuração
- ✅ Ações administrativas

**Implementação:**

```typescript
// backend/src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    
    // Log antes da execução
    const timestamp = Date.now();
    
    return next.handle().pipe(
      tap(() => {
        // Log após sucesso
        this.auditService.log({
          userId: user?.id,
          tenantId: user?.tenantId,
          action: `${method} ${url}`,
          timestamp: new Date(timestamp),
          success: true,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        });
      }),
      catchError((error) => {
        // Log após erro
        this.auditService.log({
          userId: user?.id,
          tenantId: user?.tenantId,
          action: `${method} ${url}`,
          timestamp: new Date(timestamp),
          success: false,
          error: error.message,
          ip: request.ip,
          userAgent: request.headers['user-agent']
        });
        throw error;
      })
    );
  }
}
```

**Características:**

- ✅ Logs imutáveis (append-only)
- ✅ Retenção: Mínimo 5 anos (LGPD)
- ✅ Acesso restrito (apenas admins)
- ✅ Backup regular

### Structured Logging

```typescript
// backend/src/common/logger/logger.service.ts
import { Logger } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger {
  log(message: string, context?: Record<string, any>) {
    super.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  error(message: string, trace?: string, context?: Record<string, any>) {
    super.error(JSON.stringify({
      level: 'error',
      message,
      trace,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
}
```

**Nunca logar:**

- ❌ Senhas
- ❌ Tokens JWT completos
- ❌ Dados de saúde sensíveis (PHI/PII)
- ❌ Chaves de criptografia

## Segurança de Dados Sensíveis

### PII (Personally Identifiable Information)

**Dados Sensíveis:**

- Nome completo
- CPF
- Email
- Telefone
- Endereço
- Dados de saúde (diagnóstico, tratamento)

**Proteção:**

1. **Criptografia em repouso** (AES-256)
2. **TLS em trânsito**
3. **Acesso baseado em roles**
4. **Logs de acesso**
5. **Direito ao esquecimento** (LGPD Art. 18)

### Direitos do Titular (LGPD)

**Implementação:**

```typescript
// backend/src/modules/gdpr/gdpr.service.ts
@Injectable()
export class GdprService {
  // Direito de acesso (Art. 18, II)
  async exportUserData(userId: string): Promise<UserDataExport> {
    return {
      personalInfo: await this.getPersonalInfo(userId),
      conversations: await this.getConversations(userId),
      alerts: await this.getAlerts(userId),
      // ... todos os dados do usuário
    };
  }
  
  // Direito ao esquecimento (Art. 18, VI)
  async deleteUserData(userId: string): Promise<void> {
    await this.prisma.$transaction([
      // Anonimizar dados (não deletar logs de auditoria)
      this.prisma.patient.updateMany({
        where: { id: userId },
        data: {
          name: 'ANÔNIMO',
          email: `deleted-${userId}@oncosaas.com`,
          phone: null,
          cpf: null,
          // Manter apenas ID para referência
        }
      }),
      // Deletar dados não essenciais
      this.prisma.conversation.deleteMany({
        where: { patientId: userId }
      }),
      // ... outros dados
    ]);
  }
}
```

## Compliance (LGPD/HIPAA)

### LGPD (Lei Geral de Proteção de Dados)

**Requisitos Implementados:**

- ✅ Consentimento explícito do titular
- ✅ Direito de acesso aos dados (Art. 18, II)
- ✅ Direito de correção (Art. 18, III)
- ✅ Direito ao esquecimento (Art. 18, VI)
- ✅ Portabilidade de dados (Art. 18, V)
- ✅ Notificação de incidentes (Art. 48)
- ✅ Logs de auditoria (5 anos)
- ✅ DPO nomeado (se aplicável)

### HIPAA (Health Insurance Portability and Accountability Act)

**Equivalência no Brasil:** Resolução CFM nº 2.314/2022

**Requisitos:**

- ✅ Criptografia de PHI (Protected Health Information)
- ✅ Controle de acesso baseado em roles
- ✅ Audit logs imutáveis
- ✅ Backup e disaster recovery
- ✅ BAA (Business Associate Agreement) com vendors

### Certificações

**Recomendadas para healthtech:**

- ISO 27001 (Segurança da Informação)
- ISO 27701 (Privacidade)
- HITRUST CSF (Healthcare)

## Reportar Vulnerabilidades

### Responsible Disclosure

Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **NÃO divulgue publicamente** antes de reportar
2. **Envie um email para**: security@oncosaas.com
3. **Inclua**:
   - Descrição detalhada da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestões de mitigação (se houver)

### Prazo de Resposta

- **Confirmação**: Até 48 horas
- **Triagem**: Até 7 dias
- **Correção**: Conforme severidade
  - **Crítica**: 48 horas
  - **Alta**: 7 dias
  - **Média**: 30 dias
  - **Baixa**: 90 dias

### Bug Bounty

Estamos avaliando implementar um programa de bug bounty. Vulnerabilidades reportadas responsavelmente serão reconhecidas publicamente (se autorizado).

## Checklist de Segurança

### Deploy Checklist

Antes de cada deploy para produção:

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Secrets não estão no código
- [ ] HTTPS está habilitado
- [ ] Rate limiting está ativo
- [ ] CORS está configurado corretamente
- [ ] Logs estão sendo coletados
- [ ] Backup está configurado
- [ ] Monitoring está ativo
- [ ] Tokens JWT têm expiração curta
- [ ] Multi-tenancy está validando `tenantId` em todas as queries

### Code Review Checklist

- [ ] Não expõe dados sensíveis (senhas, tokens, PHI)
- [ ] Validação de entrada adequada
- [ ] Autenticação/autorização correta
- [ ] Queries incluem `tenantId`
- [ ] Sem hardcoded secrets
- [ ] Tratamento de erros sem expor detalhes internos

---

**Última atualização**: 2024-01-XX  
**Versão**: 1.0.0

**Contato de Segurança**: security@oncosaas.com
