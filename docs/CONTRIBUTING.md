# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o OncoSaas! Este guia ajudará você a entender como contribuir de forma eficaz.

## 📋 Índice

1. [Código de Conduta](#código-de-conduta)
2. [Como Contribuir](#como-contribuir)
3. [Processo de Desenvolvimento](#processo-de-desenvolvimento)
4. [Padrões de Código](#padrões-de-código)
5. [Commits e Pull Requests](#commits-e-pull-requests)
6. [Testes](#testes)
7. [Documentação](#documentação)

## 📜 Código de Conduta

### Nossos Valores

- **Respeito**: Trate todos com respeito e empatia
- **Colaboração**: Trabalhe em equipe e compartilhe conhecimento
- **Qualidade**: Escreva código limpo, testado e documentado
- **Segurança**: Priorize segurança e privacidade dos dados

### Comportamento Esperado

- ✅ Seja respeitoso e inclusivo
- ✅ Aceite críticas construtivas
- ✅ Foque no que é melhor para o projeto
- ✅ Mostre empatia com outros membros da comunidade

### Comportamento Inaceitável

- ❌ Linguagem ou imagens sexualizadas
- ❌ Comentários insultuosos ou depreciativos
- ❌ Assédio público ou privado
- ❌ Publicar informações privadas de terceiros

## 🚀 Como Contribuir

### Tipos de Contribuição

1. **Reportar Bugs**
   - Use o template de issue
   - Inclua passos para reproduzir
   - Descreva comportamento esperado vs atual

2. **Sugerir Features**
   - Use o template de feature request
   - Explique o problema que resolve
   - Descreva a solução proposta

3. **Melhorar Documentação**
   - Corrigir erros
   - Adicionar exemplos
   - Melhorar clareza

4. **Contribuir Código**
   - Seguir processo de desenvolvimento
   - Escrever testes
   - Atualizar documentação

## 🔄 Processo de Desenvolvimento

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois clone seu fork
git clone https://github.com/SEU_USUARIO/OncoSaas.git
cd OncoSaas

# Adicionar upstream
git remote add upstream https://github.com/luizfiorimr/OncoSaas.git
```

### 2. Criar Branch

```bash
# Atualizar main
git checkout main
git pull upstream main

# Criar branch para feature/bugfix
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Desenvolver

- Siga os [Padrões de Código](#padrões-de-código)
- Escreva testes
- Atualize documentação
- Mantenha commits pequenos e atômicos

### 4. Testar

```bash
# Rodar testes
cd backend && npm test
cd frontend && npm test

# Verificar lint
npm run lint

# Verificar formatação
npm run format:check
```

### 5. Commitar

```bash
# Seguir Conventional Commits
git commit -m "feat: adiciona funcionalidade X"
git commit -m "fix: corrige bug Y"
git commit -m "docs: atualiza documentação Z"
```

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Criar Pull Request no GitHub
# Preencher template completo
# Aguardar code review
```

## 📝 Padrões de Código

### TypeScript/JavaScript

- **Sempre usar tipos explícitos**
- **Evitar `any`** (usar `unknown` com validação)
- **Nomes descritivos** para variáveis e funções
- **Funções pequenas** (máximo 50 linhas)
- **Comentários explicam "por quê", não "o quê"**

```typescript
// ✅ BOM
interface Patient {
  id: string;
  name: string;
  tenantId: string;
}

async function getPatientById(id: string, tenantId: string): Promise<Patient> {
  // ...
}

// ❌ RUIM
async function getPatient(id: any, tenant: any): Promise<any> {
  // ...
}
```

### Backend (NestJS)

- **Um módulo por feature**
- **Services contêm lógica de negócio**
- **Controllers apenas roteamento**
- **Sempre incluir `tenantId` em queries**
- **Usar DTOs para validação**

Veja [Padrões Backend](.cursor/rules/backend-padroes.mdc) para detalhes.

### Frontend (Next.js)

- **Server Components por padrão**
- **Client Components apenas quando necessário**
- **Usar React Query para dados do servidor**
- **Componentes pequenos e focados**

Veja [Padrões Frontend](.cursor/rules/frontend-padroes.mdc) para detalhes.

### Python (AI Service)

- **Type hints obrigatórios**
- **Schemas Pydantic para validação**
- **Async/await para operações I/O**
- **Docstrings para funções públicas**

```python
# ✅ BOM
from typing import Optional
from pydantic import BaseModel

class PriorityRequest(BaseModel):
    patient_id: str
    cancer_type: str
    current_stage: str

async def calculate_priority(request: PriorityRequest) -> int:
    """Calcula score de prioridade do paciente.
    
    Args:
        request: Dados do paciente
        
    Returns:
        Score de prioridade (0-100)
    """
    # ...
```

## 📦 Commits e Pull Requests

### Conventional Commits

Seguir padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

**Exemplos:**

```bash
feat(patients): adiciona filtro por prioridade
fix(alerts): corrige cálculo de atraso
docs(api): atualiza documentação de endpoints
refactor(auth): simplifica lógica de autenticação
```

### Pull Request Template

```markdown
## Descrição
Breve descrição das mudanças

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Lint passou
- [ ] Testes passaram
- [ ] Sem breaking changes (ou documentados)

## Screenshots (se aplicável)
...

## Issues Relacionadas
Closes #123
```

## 🧪 Testes

### Backend

```typescript
// Exemplo de teste
describe('PatientsService', () => {
  it('should return patients filtered by tenant', async () => {
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(2);
    expect(result.every(p => p.tenantId === 'tenant-1')).toBe(true);
  });
});
```

### Frontend

```typescript
// Exemplo de teste de componente
describe('PatientCard', () => {
  it('renders patient name', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });
});
```

### Cobertura

- **Mínimo**: 70% de cobertura
- **Objetivo**: 80%+ de cobertura
- **Crítico**: 90%+ para módulos de segurança

## 📚 Documentação

### Atualizar Documentação

Ao adicionar features ou mudar comportamento:

1. **Atualizar README** se necessário
2. **Adicionar exemplos** de uso
3. **Documentar APIs** (Swagger/OpenAPI)
4. **Atualizar guias** relevantes em `docs/`

### Padrão de Documentação

- **Clareza**: Linguagem clara e direta
- **Exemplos**: Sempre incluir exemplos práticos
- **Completude**: Cobrir todos os casos de uso
- **Atualização**: Manter documentação atualizada

## 🔍 Code Review

### Como Revisar

- **Ser construtivo**: Focar no código, não na pessoa
- **Ser específico**: Apontar exatamente o problema
- **Sugerir melhorias**: Não apenas apontar problemas
- **Aprovar rapidamente**: Se está bom, aprovar

### Como Receber Feedback

- **Aceitar críticas**: Feedback é para melhorar
- **Perguntar se não entender**: Pedir esclarecimentos
- **Aprender**: Usar feedback para crescer
- **Agradecer**: Sempre agradecer o tempo do revisor

## 🎯 Prioridades

### Alta Prioridade

- Segurança e privacidade
- Bugs críticos
- Performance
- Compliance (LGPD, ANVISA)

### Média Prioridade

- Novas features
- Melhorias de UX
- Otimizações
- Documentação

### Baixa Prioridade

- Refatorações não críticas
- Melhorias de código
- Features nice-to-have

## 📞 Dúvidas?

- **Abrir issue**: Para perguntas gerais
- **Discutir em PR**: Para questões específicas de código
- **Consultar documentação**: `docs/README.md`

## 🙏 Agradecimentos

Obrigado por contribuir! Cada contribuição, grande ou pequena, faz diferença.

---

**Última atualização**: 2024-01-XX
