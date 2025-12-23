# Como Regenerar o Prisma Client Após Adicionar Novo Modelo

**Problema:** Após adicionar o modelo `CancerDiagnosis` ao schema Prisma, o TypeScript está dando erro porque o Prisma Client ainda não foi regenerado.

**Erro:**

```
error TS2353: Object literal may only specify known properties, and 'cancerDiagnoses' does not exist in type 'PatientInclude<DefaultArgs>'.
```

---

## 🔧 Solução

### Passo 1: Parar o Servidor Backend

**Se o servidor estiver rodando:**

- Pressione `Ctrl+C` no terminal onde o backend está rodando
- Ou feche o terminal

**Verificar se está rodando:**

```bash
# Windows
netstat -ano | findstr :3002

# Se encontrar processo, matar:
taskkill /PID <PID> /F
```

---

### Passo 2: Regenerar o Prisma Client

```bash
cd backend
npx prisma generate
```

**Ou usando o script npm:**

```bash
cd backend
npm run prisma:generate
```

---

### Passo 3: Aplicar Migration (se necessário)

**Se a migration ainda não foi aplicada:**

```bash
cd backend
# Certifique-se de que DATABASE_URL está configurado no .env
npx prisma migrate dev --name add_cancer_diagnosis
```

**Ou aplicar manualmente:**

```bash
# Conectar ao PostgreSQL e executar:
psql -U postgres -d ONCONAV -f backend/prisma/migrations/add_cancer_diagnosis/migration.sql
```

---

### Passo 4: Descomentar o Código Temporário

**No arquivo `backend/src/patients/patients.service.ts`:**

Remover os comentários `// TODO` e descomentar o código:

```typescript
include: {
  journey: true,
  cancerDiagnoses: {
    where: { isActive: true },
    orderBy: [
      { isPrimary: 'desc' },
      { diagnosisDate: 'desc' },
    ],
  },
  messages: {
    // ...
  },
}
```

---

### Passo 5: Reiniciar o Servidor

```bash
cd backend
npm run start:dev
```

---

## ✅ Verificação

Após regenerar, verifique:

1. **TypeScript compila sem erros:**

```bash
cd backend
npm run type-check
```

2. **Servidor inicia sem erros:**

```bash
cd backend
npm run start:dev
```

3. **Prisma Client gerado:**

```bash
# Verificar se o arquivo foi atualizado
ls -la backend/node_modules/.prisma/client/
```

---

## 🐛 Troubleshooting

### Erro: "EPERM: operation not permitted"

**Causa:** Servidor backend ainda está usando o arquivo.

**Solução:**

1. Parar completamente o servidor (`Ctrl+C`)
2. Aguardar alguns segundos
3. Tentar novamente: `npx prisma generate`

### Erro: "Environment variable not found: DATABASE_URL"

**Causa:** Arquivo `.env` não está configurado.

**Solução:**

1. Verificar se `.env` existe em `backend/.env`
2. Verificar se `DATABASE_URL` está definido
3. Se não existir, copiar de `.env.example`

### Erro: "Migration not found"

**Causa:** Migration não foi criada ainda.

**Solução:**

1. Criar migration: `npx prisma migrate dev --name add_cancer_diagnosis`
2. Ou aplicar manualmente o SQL em `backend/prisma/migrations/add_cancer_diagnosis/migration.sql`

---

**Última atualização:** 2024-01-XX
