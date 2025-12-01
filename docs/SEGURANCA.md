# 🔒 Segurança e Compliance

Documentação completa sobre segurança, privacidade e compliance do OncoSaas.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [LGPD (Lei Geral de Proteção de Dados)](#lgpd)
3. [ANVISA (SaMD)](#anvisa)
4. [Segurança Técnica](#segurança-técnica)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Criptografia](#criptografia)
7. [Auditoria](#auditoria)
8. [Backup e Recuperação](#backup-e-recuperação)
9. [Checklist de Compliance](#checklist-de-compliance)

## 🎯 Visão Geral

O OncoSaas lida com dados sensíveis de saúde (dados pessoais sensíveis segundo LGPD) e deve seguir rigorosos padrões de segurança e compliance.

### Princípios Fundamentais

- **Confidencialidade**: Dados protegidos contra acesso não autorizado
- **Integridade**: Dados protegidos contra alteração não autorizada
- **Disponibilidade**: Sistema disponível quando necessário
- **Rastreabilidade**: Todas as ações são auditadas
- **Privacidade**: Dados minimizados e protegidos

## 📜 LGPD (Lei Geral de Proteção de Dados)

### Dados Sensíveis

Dados de saúde são considerados **dados pessoais sensíveis** pela LGPD:

- Informações sobre saúde ou vida sexual
- Dados biométricos
- Dados genéticos

### Requisitos LGPD

#### 1. Consentimento

- Consentimento explícito para coleta de dados
- Informação clara sobre uso dos dados
- Possibilidade de revogação

#### 2. Minimização de Dados

- Coletar apenas dados necessários
- Não armazenar dados desnecessários
- Anonimizar quando possível

#### 3. Direitos do Titular

- **Acesso**: Obter cópia dos dados
- **Correção**: Corrigir dados incorretos
- **Exclusão**: Solicitar exclusão de dados
- **Portabilidade**: Exportar dados em formato estruturado
- **Revogação**: Revogar consentimento

#### 4. Segurança Técnica

- Criptografia em trânsito (TLS 1.3)
- Criptografia em repouso (AES-256)
- Controle de acesso (RBAC)
- Auditoria completa

#### 5. Notificação de Incidentes

- Notificar ANPD em até 72h em caso de vazamento
- Notificar titulares afetados
- Documentar incidente

### Implementação no OncoSaas

```typescript
// Exemplo: Criptografia de dados sensíveis
import * as crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ALGORITHM = 'aes-256-gcm';

function encryptSensitiveData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

## 🏥 ANVISA (SaMD - Software as Medical Device)

### Classificação

O OncoSaas pode ser classificado como **SaMD Classe II** (risco moderado):

- Software que auxilia na tomada de decisão clínica
- Não é dispositivo médico físico
- Requer registro na ANVISA para comercialização

### Requisitos ANVISA

#### 1. Validação Clínica

- Evidências de eficácia e segurança
- Estudos clínicos ou literatura científica
- Documentação completa

#### 2. Qualidade de Software

- Processo de desenvolvimento documentado
- Testes e validação
- Controle de versão
- Gestão de riscos

#### 3. Rastreabilidade

- Rastreabilidade de requisitos
- Rastreabilidade de código
- Histórico de mudanças

#### 4. Documentação Técnica

- Especificações técnicas
- Manual de usuário
- Instruções de uso
- Avisos e contraindicações

### Implementação

- Documentação técnica completa
- Processo de desenvolvimento padronizado
- Testes automatizados
- Validação clínica (quando aplicável)

## 🛡️ Segurança Técnica

### Criptografia

#### Em Trânsito

- **TLS 1.3** obrigatório para todas as comunicações
- Certificados SSL válidos (Let's Encrypt ou comercial)
- HSTS (HTTP Strict Transport Security)

```nginx
# Nginx configuration
ssl_protocols TLSv1.3;
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
ssl_prefer_server_ciphers off;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

#### Em Repouso

- **AES-256-GCM** para dados sensíveis
- Chaves de criptografia em variáveis de ambiente
- Rotação de chaves periódica

### Controle de Acesso

#### Autenticação

- JWT tokens com expiração
- Refresh tokens
- MFA (Multi-Factor Authentication) obrigatório para profissionais de saúde

#### Autorização

- RBAC (Role-Based Access Control)
- Permissões granulares por recurso
- Isolamento multi-tenant obrigatório

```typescript
// Exemplo: Guard de autorização
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('NURSE', 'ONCOLOGIST', 'ADMIN')
@Controller('patients')
export class PatientsController {
  // ...
}
```

### Validação de Dados

- Validação de entrada em todas as APIs
- Sanitização de dados
- Proteção contra SQL Injection (Prisma ORM)
- Proteção contra XSS (React sanitização)

### Rate Limiting

- Limitação de requisições por IP
- Limitação de requisições por usuário
- Proteção contra DDoS

```typescript
// Exemplo: Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requisições por IP
});

app.use('/api/', limiter);
```

## 🔐 Autenticação e Autorização

### JWT Tokens

```typescript
// Geração de token
const token = jwt.sign(
  { 
    userId: user.id, 
    tenantId: user.tenantId, 
    role: user.role 
  },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

### MFA (Multi-Factor Authentication)

- TOTP (Time-based One-Time Password)
- SMS backup (opcional)
- Obrigatório para roles: ONCOLOGIST, DOCTOR, NURSE_CHIEF

### Roles e Permissões

```typescript
enum UserRole {
  ADMIN = 'ADMIN',              // Acesso total
  ONCOLOGIST = 'ONCOLOGIST',    // Acesso completo a pacientes
  DOCTOR = 'DOCTOR',            // Acesso a pacientes atribuídos
  NURSE_CHIEF = 'NURSE_CHIEF',  // Supervisão de enfermagem
  NURSE = 'NURSE',              // Acesso limitado
  COORDINATOR = 'COORDINATOR'   // Coordenação de navegação
}
```

## 🔒 Criptografia

### Dados Criptografados

- CPF
- Telefone (WhatsApp)
- Tokens OAuth (Facebook/WhatsApp)
- Credenciais de integração

### Implementação

```typescript
// Schema Prisma com campos criptografados
model Patient {
  cpf       String? // Criptografado
  phone     String  // Criptografado
  phoneHash String? // Hash SHA-256 para busca (indexado)
}
```

### Hash para Busca

Para permitir busca sem descriptografar:

```typescript
import * as crypto from 'crypto';

function hashPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, ''); // Remove não-dígitos
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Buscar por hash
const phoneHash = hashPhone('+5511999999999');
const patient = await prisma.patient.findFirst({
  where: { phoneHash, tenantId }
});
```

## 📝 Auditoria

### Logs de Auditoria

Todas as ações críticas são registradas:

- Criação/edição/exclusão de pacientes
- Acesso a dados sensíveis
- Alterações de configuração
- Autenticações e autorizações

```typescript
// Exemplo: Log de auditoria
await prisma.auditLog.create({
  data: {
    userId: req.user.id,
    tenantId: req.user.tenantId,
    action: 'PATIENT_VIEWED',
    resourceType: 'Patient',
    resourceId: patientId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    metadata: { /* dados adicionais */ }
  }
});
```

### Retenção de Logs

- Logs de auditoria: **5 anos** (LGPD)
- Logs de aplicação: **1 ano**
- Logs de acesso: **6 meses**

### Imutabilidade

- Logs de auditoria são **imutáveis**
- Apenas append, nunca edição ou exclusão
- Backup separado de logs

## 💾 Backup e Recuperação

### Estratégia de Backup

- **Backup diário** do banco de dados
- **Backup semanal** completo (DB + arquivos)
- **Backup incremental** a cada 6 horas
- **Retenção**: 30 dias (diários), 12 meses (semanais)

### Criptografia de Backups

- Todos os backups são **criptografados**
- Chaves de criptografia em cofre separado
- Teste de restauração mensal

### RTO e RPO

- **RTO (Recovery Time Objective)**: 4 horas
- **RPO (Recovery Point Objective)**: 24 horas

## ✅ Checklist de Compliance

### LGPD

- [ ] Consentimento explícito implementado
- [ ] Política de privacidade publicada
- [ ] Direitos do titular implementados (acesso, correção, exclusão, portabilidade)
- [ ] Criptografia de dados sensíveis
- [ ] Auditoria completa
- [ ] DPO (Data Protection Officer) nomeado
- [ ] Plano de resposta a incidentes

### ANVISA

- [ ] Classificação SaMD definida
- [ ] Validação clínica documentada
- [ ] Processo de desenvolvimento documentado
- [ ] Testes e validação realizados
- [ ] Manual de usuário disponível
- [ ] Registro na ANVISA (quando aplicável)

### Segurança Técnica

- [ ] TLS 1.3 configurado
- [ ] Criptografia em repouso (AES-256)
- [ ] Autenticação MFA implementada
- [ ] RBAC configurado
- [ ] Rate limiting ativo
- [ ] Validação de dados em todas as APIs
- [ ] Logs de auditoria imutáveis
- [ ] Backup automatizado e testado

### Operacional

- [ ] Monitoramento ativo
- [ ] Plano de resposta a incidentes
- [ ] Teste de recuperação de desastres
- [ ] Documentação de segurança atualizada
- [ ] Treinamento da equipe

## 📚 Recursos Adicionais

- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANVISA - RDC 330/2019](https://www.gov.br/anvisa/pt-br/assuntos/regulamentacao/regulamentacao-de-produtos-para-saude)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Última atualização**: 2024-01-XX
