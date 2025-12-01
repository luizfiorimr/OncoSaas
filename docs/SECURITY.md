# 🔒 Segurança - OncoSaas

Este documento descreve as práticas de segurança, compliance e proteção de dados implementadas no OncoSaas.

---

## Visão Geral

O OncoSaas lida com dados sensíveis de saúde (PHI - Protected Health Information), exigindo conformidade com:

- **LGPD** (Lei Geral de Proteção de Dados) - Brasil
- **Resoluções CFM** - Conselho Federal de Medicina
- **RDC ANVISA** - Para software médico
- **Melhores práticas OWASP** - Segurança de aplicações web

---

## Multi-Tenancy e Isolamento de Dados

### Schema por Tenant

```
PostgreSQL
├── public (schema base)
├── tenant_hospital_a
│   ├── patients
│   ├── messages
│   └── alerts
├── tenant_hospital_b
│   ├── patients
│   ├── messages
│   └── alerts
└── tenant_clinica_c
    └── ...
```

### Implementação

```typescript
// TODA query DEVE incluir tenantId
const patients = await prisma.patient.findMany({
  where: { 
    tenantId: req.user.tenantId  // OBRIGATÓRIO
  }
});

// Guard de validação de tenant
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    
    if (!tenantId) {
      throw new ForbiddenException('Tenant não identificado');
    }
    
    return true;
  }
}
```

### Regras de Isolamento

| Recurso | Nível de Isolamento |
|---------|---------------------|
| Pacientes | Tenant |
| Mensagens | Tenant + Paciente |
| Alertas | Tenant |
| Usuários | Tenant |
| Configurações | Tenant |
| Logs de Auditoria | Tenant |

---

## Autenticação

### JWT (JSON Web Token)

```typescript
// Estrutura do token
interface JwtPayload {
  sub: string;       // User ID
  email: string;
  tenantId: string;  // Isolamento de tenant
  roles: string[];   // RBAC
  iat: number;       // Issued at
  exp: number;       // Expiration
}

// Configuração
{
  secret: process.env.JWT_SECRET,  // Mínimo 256 bits
  expiresIn: '24h',
  algorithm: 'HS256'
}
```

### Refresh Tokens

```typescript
// Access Token: 15 minutos (produção) / 24h (desenvolvimento)
// Refresh Token: 7 dias

@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  // Validar refresh token
  // Gerar novo access token
  // Rotacionar refresh token (one-time use)
}
```

### OAuth 2.0

Para integrações externas:
- WhatsApp Business API
- Sistemas hospitalares

---

## Autorização (RBAC)

### Roles do Sistema

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador do sistema | Todas |
| `oncologist` | Oncologista | Pacientes, tratamentos |
| `nurse` | Enfermeiro(a) | Dashboard, alertas, navegação |
| `manager` | Gestor | Relatórios, métricas |

### Implementação

```typescript
// Decorator de roles
@Roles('admin', 'nurse')
@Get('patients')
async getPatients() { ... }

// Guard de validação
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    
    return requiredRoles.some(role => user.roles.includes(role));
  }
}
```

### Matriz de Permissões

| Recurso | admin | oncologist | nurse | manager |
|---------|-------|------------|-------|---------|
| Pacientes - Criar | ✅ | ✅ | ✅ | ❌ |
| Pacientes - Editar | ✅ | ✅ | ✅ | ❌ |
| Pacientes - Deletar | ✅ | ❌ | ❌ | ❌ |
| Mensagens - Visualizar | ✅ | ✅ | ✅ | ❌ |
| Mensagens - Enviar | ✅ | ✅ | ✅ | ❌ |
| Alertas - Visualizar | ✅ | ✅ | ✅ | ✅ |
| Alertas - Assumir | ✅ | ✅ | ✅ | ❌ |
| Dashboard - Visualizar | ✅ | ✅ | ✅ | ✅ |
| Métricas - Exportar | ✅ | ❌ | ❌ | ✅ |
| Usuários - Gerenciar | ✅ | ❌ | ❌ | ❌ |

---

## Criptografia

### Em Trânsito (TLS)

```nginx
# Nginx - TLS 1.3 obrigatório
ssl_protocols TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
```

### Em Repouso (AES-256)

```typescript
// Campos sensíveis criptografados
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Campos Criptografados

- Conteúdo de mensagens WhatsApp
- Dados clínicos sensíveis
- Documentos anexados
- Notas de enfermagem

### Hash de Senhas

```typescript
import * as bcrypt from 'bcrypt';

// Hash com salt rounds = 12
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

## Auditoria (Audit Logs)

### Estrutura de Log

```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  oldValue?: object;
  newValue?: object;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
}
```

### Eventos Auditados

| Categoria | Eventos |
|-----------|---------|
| Autenticação | Login, logout, falha de login, alteração de senha |
| Pacientes | Criar, visualizar, editar, deletar |
| Mensagens | Enviar, visualizar |
| Alertas | Visualizar, assumir, resolver |
| Usuários | Criar, editar, desativar |
| Exportações | Relatórios, dados de pacientes |

### Retenção de Logs

- **Mínimo**: 5 anos (LGPD)
- **Recomendado**: 10 anos (prontuário médico)
- **Formato**: Imutável (append-only)
- **Armazenamento**: CloudWatch Logs / S3 Glacier

---

## Proteção contra Ataques

### OWASP Top 10

#### 1. Injection (SQL, NoSQL)

```typescript
// ❌ Vulnerável
const query = `SELECT * FROM patients WHERE id = '${id}'`;

// ✅ Seguro - Prisma com tipos
const patient = await prisma.patient.findUnique({
  where: { id }  // Sanitizado automaticamente
});
```

#### 2. Broken Authentication

```typescript
// Rate limiting em login
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 tentativas por minuto
@Post('login')
async login() { ... }

// Bloqueio após tentativas falhas
if (failedAttempts >= 5) {
  throw new TooManyRequestsException('Conta bloqueada por 15 minutos');
}
```

#### 3. Sensitive Data Exposure

```typescript
// Nunca retornar senhas ou dados sensíveis
@Get('users/:id')
async getUser(@Param('id') id: string) {
  const user = await this.usersService.findOne(id);
  
  // Remover campos sensíveis
  const { password, refreshToken, ...safeUser } = user;
  return safeUser;
}
```

#### 4. XSS (Cross-Site Scripting)

```typescript
// Next.js escapa automaticamente em JSX
<div>{user.name}</div>  // Seguro

// Para HTML dinâmico, use sanitização
import DOMPurify from 'dompurify';
const cleanHtml = DOMPurify.sanitize(htmlContent);
```

#### 5. CSRF (Cross-Site Request Forgery)

```typescript
// Next.js: Cookies com SameSite
// NestJS: CORS configurado
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

// Tokens CSRF em formulários
@Post('submit')
@UseCsrfProtection()
async submit() { ... }
```

#### 6. Security Misconfiguration

```typescript
// Headers de segurança
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));
```

### Rate Limiting

```typescript
// Global
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // Janela de tempo (segundos)
      limit: 100,   // Requisições por janela
    }),
  ],
})

// Por endpoint
@Throttle(10, 60)  // 10 requisições por minuto
@Get('sensitive')
async sensitive() { ... }
```

---

## Proteção de Dados (LGPD)

### Dados Pessoais Coletados

| Categoria | Dados | Base Legal |
|-----------|-------|------------|
| Identificação | Nome, CPF, RG | Execução de contrato |
| Contato | Telefone, email | Consentimento |
| Saúde | Diagnóstico, tratamento | Tutela da saúde |
| Localização | Endereço | Execução de contrato |
| Navegação | IP, cookies | Legítimo interesse |

### Direitos do Titular

```typescript
// Portabilidade de dados
@Get('export')
async exportData(@Request() req) {
  return this.gdprService.exportUserData(req.user.id);
}

// Exclusão de dados (direito ao esquecimento)
@Delete('delete-account')
async deleteAccount(@Request() req) {
  return this.gdprService.anonymizeUserData(req.user.id);
}

// Retificação
@Patch('correct')
async correctData(@Request() req, @Body() dto: CorrectionDto) {
  return this.gdprService.correctUserData(req.user.id, dto);
}
```

### Consentimento

```typescript
interface Consent {
  userId: string;
  purpose: string;
  granted: boolean;
  timestamp: Date;
  version: string;
}

// Registrar consentimento
@Post('consent')
async grantConsent(@Request() req, @Body() dto: ConsentDto) {
  return this.consentService.record(req.user.id, dto);
}
```

### Anonimização

```typescript
// Anonimizar dados após período de retenção ou solicitação
async anonymizePatient(patientId: string) {
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      name: 'ANONIMIZADO',
      phone: hash(phone),
      email: null,
      dateOfBirth: null,
      // Manter dados agregados para estatísticas
    },
  });
}
```

---

## Segurança de API

### Validação de Entrada

```typescript
// DTOs com validação rigorosa
import { IsString, IsEmail, Length, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Senha deve conter: maiúscula, minúscula, número e caractere especial',
  })
  password: string;

  @IsString()
  @Matches(/^\+\d{10,15}$/)
  phone: string;
}
```

### Sanitização

```typescript
// Pipe global de validação
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // Remove campos não definidos
  forbidNonWhitelisted: true, // Erro se campos extras
  transform: true,            // Transforma tipos
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

### Paginação Segura

```typescript
// Limitar tamanho de página
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)  // Máximo 100 items por página
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
```

---

## Segurança de Infraestrutura

### AWS Security

```yaml
# Security Groups
- Frontend ALB: 443 (HTTPS) from 0.0.0.0/0
- Backend ALB: 443 from Frontend SG only
- Database: 5432 from Backend SG only
- Redis: 6379 from Backend SG only
```

### Secrets Management

```typescript
// AWS Secrets Manager
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return response.SecretString;
}

// Nunca commitar secrets
// .env.example (template)
// .env (local, no .gitignore)
```

### Backup e Recuperação

```yaml
# RDS Automated Backups
Retention: 30 days
Point-in-Time Recovery: Enabled
Encryption: AES-256

# S3 Backups
Lifecycle:
  - Transition to Glacier: 90 days
  - Delete: 7 years
```

---

## Resposta a Incidentes

### Classificação

| Severidade | Descrição | Tempo de Resposta |
|------------|-----------|-------------------|
| Crítica | Vazamento de dados, sistema down | 15 minutos |
| Alta | Tentativa de invasão detectada | 1 hora |
| Média | Vulnerabilidade descoberta | 4 horas |
| Baixa | Anomalia de segurança | 24 horas |

### Procedimentos

1. **Detecção**: Monitoramento contínuo (CloudWatch, alertas)
2. **Contenção**: Isolar sistemas afetados
3. **Erradicação**: Remover causa raiz
4. **Recuperação**: Restaurar serviços
5. **Lições Aprendidas**: Documentar e melhorar

### Notificação LGPD

Em caso de incidente de segurança com dados pessoais:

1. Notificar ANPD em até 2 dias úteis
2. Notificar titulares afetados
3. Documentar incidente
4. Implementar medidas corretivas

---

## Checklist de Segurança

### Desenvolvimento

- [ ] Todas as queries incluem `tenantId`
- [ ] Senhas hasheadas com bcrypt (rounds >= 12)
- [ ] Validação de entrada em todos os endpoints
- [ ] Dados sensíveis criptografados
- [ ] Logs não contêm dados sensíveis
- [ ] Dependências atualizadas e sem vulnerabilidades conhecidas

### Deploy

- [ ] HTTPS obrigatório (TLS 1.3)
- [ ] Headers de segurança configurados
- [ ] CORS restrito
- [ ] Rate limiting ativo
- [ ] WAF configurado (se aplicável)
- [ ] Backups testados

### Operação

- [ ] Monitoramento de logs ativo
- [ ] Alertas de segurança configurados
- [ ] Rotação de credenciais
- [ ] Revisão de acessos periódica
- [ ] Testes de penetração anuais

---

## Contato de Segurança

Para reportar vulnerabilidades:
- **Email**: security@oncosaas.com
- **Bug Bounty**: (em desenvolvimento)

Todas as vulnerabilidades reportadas serão investigadas e respondidas em até 48 horas.
