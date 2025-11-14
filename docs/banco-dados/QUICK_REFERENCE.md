# 🚀 Quick Reference - PostgreSQL Connection

## Conexão Rápida

### URL de Conexão

```
postgresql://medsaas:medsaas_dev@localhost:5433/medsaas_development
```

### Credenciais

- **Host**: `localhost`
- **Porta**: `5433`
- **Usuário**: `medsaas`
- **Senha**: `medsaas_dev`
- **Database**: `medsaas_development`

---

## Comandos Essenciais

### Docker

```bash
# Iniciar banco
docker-compose up -d postgres

# Ver logs
docker-compose logs -f postgres

# Parar banco
docker-compose stop postgres
```

### Prisma

```bash
cd backend

# Gerar cliente
npx prisma generate

# Aplicar migrations
npx prisma migrate dev

# Abrir Prisma Studio (GUI)
npx prisma studio

# Resetar banco (⚠️ apaga dados)
npx prisma migrate reset
```

### psql (CLI)

```bash
# Conectar
psql -h localhost -p 5433 -U medsaas -d medsaas_development

# Ou com URL
psql postgresql://medsaas:medsaas_dev@localhost:5433/medsaas_development
```

---

## Estrutura Principal

### Tabelas Multi-Tenant (sempre incluir `tenantId`)

- `patients` - Pacientes oncológicos
- `messages` - Mensagens WhatsApp
- `alerts` - Alertas do sistema
- `patient_journeys` - Jornada do paciente
- `navigation_steps` - Etapas de navegação
- `cancer_diagnoses` - Diagnósticos de câncer
- `observations` - Observações clínicas (FHIR)
- `questionnaires` - Questionários
- `questionnaire_responses` - Respostas
- `whatsapp_connections` - Conexões WhatsApp
- `audit_logs` - Logs de auditoria
- `internal_notes` - Notas internas
- `interventions` - Intervenções

### Tabelas Compartilhadas

- `tenants` - Hospitais/clínicas
- `users` - Usuários do sistema
- `oauth_states` - Estados temporários OAuth

---

## ⚠️ Regra Crítica

**SEMPRE incluir `tenantId` em queries:**

```typescript
// ✅ CORRETO
await prisma.patient.findMany({
  where: { tenantId, status: 'ACTIVE' },
});

// ❌ ERRADO
await prisma.patient.findMany({
  where: { status: 'ACTIVE' }, // FALTA tenantId!
});
```

---

## Variável de Ambiente

```env
DATABASE_URL=postgresql://medsaas:medsaas_dev@localhost:5433/medsaas_development
```

---

## Troubleshooting Rápido

| Problema                | Solução                         |
| ----------------------- | ------------------------------- |
| Connection refused      | `docker-compose up -d postgres` |
| Database does not exist | `npx prisma migrate dev`        |
| Relation does not exist | `npx prisma migrate deploy`     |
| Permission denied       | Verificar credenciais no `.env` |

---

📖 **Documentação completa**: [postgres-estrutura-e-conexao.md](./postgres-estrutura-e-conexao.md)
