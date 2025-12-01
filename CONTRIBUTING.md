# 🤝 Guia de Contribuição - OncoSaas

Obrigado por considerar contribuir para o OncoSaas! Este guia ajudará você a começar.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Começar](#como-começar)
- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Commits e Pull Requests](#commits-e-pull-requests)
- [Testes](#testes)
- [Code Review](#code-review)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Features](#sugerir-features)

## Código de Conduta

Este projeto adota um código de conduta. Ao participar, você concorda em seguir suas diretrizes:

- **Seja respeitoso**: Trate todos com respeito e empatia
- **Seja construtivo**: Críticas devem ser construtivas e focadas no código, não na pessoa
- **Seja colaborativo**: Estamos todos trabalhando juntos para melhorar a saúde oncológica
- **Seja inclusivo**: Todos são bem-vindos, independente de experiência, origem ou background

## Como Começar

### 1. Setup do Ambiente

Siga o guia detalhado em [`docs/desenvolvimento/setup-desenvolvimento.md`](docs/desenvolvimento/setup-desenvolvimento.md).

**Resumo:**

```bash
# 1. Clone o repositório
git clone https://github.com/luizfiorimr/OncoSaas.git
cd OncoSaas

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# 3. Instale dependências
cd frontend && npm install
cd ../backend && npm install
cd ../ai-service && pip install -r requirements.txt

# 4. Inicie serviços
docker-compose up -d postgres redis

# 5. Rode migrations
cd backend && npx prisma migrate dev

# 6. Inicie aplicação
npm run dev  # Frontend e Backend em paralelo
```

### 2. Escolha uma Issue

- Navegue pelas [Issues abertas](https://github.com/luizfiorimr/OncoSaas/issues)
- Issues marcadas com `good first issue` são ideais para iniciantes
- Issues marcadas com `help wanted` precisam de ajuda da comunidade
- Comente na issue que você gostaria de trabalhar nela para evitar duplicação

### 3. Crie uma Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature
```

## Workflow de Desenvolvimento

### Estrutura de Branches

```
main (produção)
  ↑
develop (desenvolvimento)
  ↑
feature/* (novas features)
fix/* (correções de bugs)
docs/* (documentação)
refactor/* (refatorações)
test/* (testes)
```

**Regras:**

- `main`: Código em produção, **nunca commitar diretamente**
- `develop`: Branch de desenvolvimento, base para features
- `feature/*`: Novas funcionalidades
- `fix/*`: Correções de bugs
- `docs/*`: Mudanças apenas em documentação
- `refactor/*`: Refatorações sem mudança de funcionalidade
- `test/*`: Adição ou correção de testes

### Workflow Completo

```bash
# 1. Atualizar develop
git checkout develop
git pull origin develop

# 2. Criar branch
git checkout -b feature/minha-feature

# 3. Desenvolver e commitar
git add .
git commit -m "feat: adiciona funcionalidade X"

# 4. Push para remoto
git push origin feature/minha-feature

# 5. Abrir Pull Request para 'develop'
# Via GitHub: https://github.com/luizfiorimr/OncoSaas/compare

# 6. Aguardar code review

# 7. Fazer ajustes se solicitado

# 8. Após aprovação, merge será feito por mantenedor
```

## Padrões de Código

### Frontend (Next.js 14 + TypeScript)

#### Estrutura de Componentes

```typescript
// ✅ CORRETO
// src/components/patients/PatientCard.tsx
import React from 'react';
import { Patient } from '@/types/patient';

interface PatientCardProps {
  patient: Patient;
  onClick?: (id: string) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ 
  patient, 
  onClick 
}) => {
  return (
    <div onClick={() => onClick?.(patient.id)}>
      <h3>{patient.name}</h3>
      {/* ... */}
    </div>
  );
};
```

#### Custom Hooks

```typescript
// ✅ CORRETO
// src/hooks/usePatients.ts
import { useQuery } from '@tanstack/react-query';

export const usePatients = (tenantId: string) => {
  return useQuery({
    queryKey: ['patients', tenantId],
    queryFn: () => fetchPatients(tenantId),
    staleTime: 5 * 60 * 1000,
  });
};
```

#### Regras Gerais

- ✅ Componentes funcionais (não usar classes)
- ✅ TypeScript strict mode
- ✅ Props tipadas com interfaces
- ✅ Hooks customizados para lógica reutilizável
- ✅ `'use client'` apenas quando necessário (interatividade)
- ✅ Memoização quando apropriado (`memo`, `useMemo`, `useCallback`)

### Backend (NestJS + TypeScript)

#### Estrutura de Módulo

```typescript
// ✅ CORRETO
// src/modules/patients/patients.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}

// src/modules/patients/patients.controller.ts
@Controller('patients')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async findAll(@Request() req): Promise<Patient[]> {
    return this.patientsService.findAll(req.user.tenantId);
  }
}

// src/modules/patients/patients.service.ts
@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      where: { tenantId }, // SEMPRE incluir tenantId
    });
  }
}
```

#### DTOs com Validação

```typescript
// ✅ CORRETO
// src/modules/patients/dto/create-patient.dto.ts
import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

#### Regras Gerais

- ✅ Um módulo por feature/domínio
- ✅ Controllers apenas roteamento e validação
- ✅ Services contêm lógica de negócio
- ✅ DTOs para validação de entrada
- ✅ **SEMPRE incluir `tenantId` em queries**
- ✅ Tratamento de erros com exceptions do NestJS
- ✅ Logging estruturado

### AI Service (Python + FastAPI)

#### Estrutura de Rota

```python
# ✅ CORRETO
# src/api/routes/priority.py
from fastapi import APIRouter, Depends
from src.schemas.priority import PriorityRequest, PriorityResponse
from src.services.priority_service import PriorityService

router = APIRouter(prefix="/priority", tags=["priority"])

@router.post("/calculate", response_model=PriorityResponse)
async def calculate_priority(
    request: PriorityRequest,
    tenant_id: str = Depends(get_tenant_id)
):
    service = PriorityService()
    result = await service.predict(request, tenant_id)
    return PriorityResponse(**result)
```

#### Schemas Pydantic

```python
# ✅ CORRETO
# src/schemas/priority.py
from pydantic import BaseModel, Field
from typing import List, Optional

class PriorityRequest(BaseModel):
    patient_id: str = Field(..., description="ID do paciente")
    symptoms: List[str] = Field(..., min_items=1)
    cancer_type: str
    
    class Config:
        schema_extra = {
            "example": {
                "patient_id": "uuid",
                "symptoms": ["dor abdominal", "vômitos"],
                "cancer_type": "COLORECTAL"
            }
        }
```

#### Regras Gerais

- ✅ Type hints obrigatórios
- ✅ Docstrings em funções públicas
- ✅ Schemas Pydantic para validação
- ✅ Funções async quando possível
- ✅ Seguir PEP 8 (usar `black` e `isort`)
- ✅ Logging estruturado

### Banco de Dados (Prisma)

#### Schema

```prisma
// ✅ CORRETO
model Patient {
  id        String   @id @default(uuid())
  name      String
  email     String
  tenantId  String   @map("tenant_id")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  conversations Conversation[]

  @@index([tenantId])
  @@index([tenantId, priorityScore])
  @@map("patients")
}
```

#### Regras Gerais

- ✅ Sempre usar `camelCase` no schema, `snake_case` no banco (com `@map`)
- ✅ Índices em campos de busca frequente (`tenantId`)
- ✅ Relacionamentos explícitos
- ✅ `@default(uuid())` para IDs
- ✅ `createdAt` e `updatedAt` em todos os modelos

## Commits e Pull Requests

### Formato de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Mudanças em documentação
- `style`: Formatação, sem mudança de código
- `refactor`: Refatoração, sem mudança de funcionalidade
- `test`: Adição ou correção de testes
- `chore`: Mudanças em build, CI, dependências

**Exemplos:**

```bash
feat(patients): adiciona endpoint de listagem com filtros
fix(auth): corrige validação de token expirado
docs(api): atualiza documentação da API de priorização
refactor(alerts): melhora performance de queries
test(patients): adiciona testes unitários para PatientsService
chore(deps): atualiza dependências do frontend
```

### Pull Requests

#### Template de PR

```markdown
## Descrição

Breve descrição do que foi feito.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Todas as verificações de CI passaram
- [ ] Code review foi solicitado

## Screenshots (se aplicável)

(Adicione imagens aqui)

## Issues Relacionadas

Closes #123
```

#### Processo de Review

1. **Abra PR para `develop`** (nunca para `main`)
2. **Aguarde CI passar** (testes, lint, build)
3. **Solicite review** de pelo menos 1 mantenedor
4. **Faça ajustes** se solicitado
5. **Após aprovação**, mantenedor fará merge

#### Boas Práticas

- ✅ PRs pequenos e focados (1 feature por PR)
- ✅ Descrição clara e detalhada
- ✅ Screenshots se mudança visual
- ✅ Referenciar issues relacionadas
- ✅ Responder comentários de review
- ✅ Manter PR atualizado com `develop`

## Testes

### Frontend (Jest + React Testing Library)

```typescript
// ✅ CORRETO
// src/components/patients/__tests__/PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from '../PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: '1',
    name: 'João Silva',
    priorityScore: 85
  };

  it('renders patient name', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<PatientCard patient={mockPatient} onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('João Silva'));
    expect(handleClick).toHaveBeenCalledWith('1');
  });
});
```

### Backend (Jest)

```typescript
// ✅ CORRETO
// src/modules/patients/patients.service.spec.ts
import { Test } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: PrismaService,
          useValue: {
            patient: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(PatientsService);
    prisma = module.get(PrismaService);
  });

  it('should return patients filtered by tenant', async () => {
    const mockPatients = [{ id: '1', name: 'Test', tenantId: 'tenant-1' }];
    jest.spyOn(prisma.patient, 'findMany').mockResolvedValue(mockPatients);

    const result = await service.findAll('tenant-1');

    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
    });
    expect(result).toEqual(mockPatients);
  });
});
```

### AI Service (pytest)

```python
# ✅ CORRETO
# tests/test_priority_service.py
import pytest
from src.services.priority_service import PriorityService

@pytest.fixture
def priority_service():
    return PriorityService()

@pytest.mark.asyncio
async def test_calculate_priority_high_risk(priority_service):
    request = PriorityRequest(
        patient_id="uuid",
        symptoms=["dor abdominal intensa", "vômitos", "febre"],
        cancer_type="COLORECTAL"
    )
    
    result = await priority_service.predict(request, "tenant-1")
    
    assert result["score"] >= 70
    assert result["category"] == "high"
```

### Executando Testes

```bash
# Frontend
cd frontend
npm test                    # Todos os testes
npm test -- --watch        # Watch mode
npm test -- --coverage     # Com coverage

# Backend
cd backend
npm test                    # Todos os testes
npm test -- --watch        # Watch mode
npm test -- --coverage     # Com coverage

# AI Service
cd ai-service
pytest                      # Todos os testes
pytest -v                   # Verbose
pytest --cov=src           # Com coverage
```

### Cobertura de Testes

**Mínimo Esperado:**

- Frontend: 70%
- Backend: 70%
- AI Service: 80%

**Obrigatório testar:**

- ✅ Lógica de negócio (services)
- ✅ Validações (DTOs)
- ✅ Fluxos críticos (autenticação, priorização)
- ✅ Edge cases e erros

**Opcional:**

- Controllers (maioria é roteamento simples)
- Componentes UI muito simples (apenas apresentação)

## Code Review

### Como Fazer Code Review

Se você foi solicitado para revisar um PR:

1. **Entenda o contexto**: Leia a descrição e issues relacionadas
2. **Execute o código**: Rode localmente para testar
3. **Revise o código**: Busque por:
   - ❌ Bugs ou lógica incorreta
   - ❌ Problemas de segurança (senhas, tokens, SQL injection)
   - ❌ Falta de validação de entrada
   - ❌ Queries sem `tenantId`
   - ❌ Código não testado
   - ❌ Documentação faltando
4. **Seja construtivo**: Sugestões, não ordens
5. **Aprove ou solicite mudanças**: Seja claro sobre o que precisa ser ajustado

### Checklist de Review

**Segurança:**

- [ ] Não expõe dados sensíveis (senhas, tokens, PII)
- [ ] Valida entrada do usuário
- [ ] Usa autenticação/autorização adequada
- [ ] Queries incluem `tenantId`

**Qualidade:**

- [ ] Código é legível e bem estruturado
- [ ] Segue padrões do projeto
- [ ] Testes adequados
- [ ] Sem console.log/print em produção
- [ ] Tratamento de erros

**Performance:**

- [ ] Não há N+1 queries
- [ ] Paginação implementada se necessário
- [ ] Cache usado quando apropriado

**Documentação:**

- [ ] Código é autoexplicativo
- [ ] Comentários onde necessário
- [ ] Documentação atualizada se necessário

## Reportar Bugs

Use o [template de bug](https://github.com/luizfiorimr/OncoSaas/issues/new?template=bug_report.md):

```markdown
**Descrição do Bug**
Descrição clara do problema.

**Como Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Versão: [e.g. 1.2.3]

**Logs**
```
Cole logs relevantes aqui
```
```

## Sugerir Features

Use o [template de feature](https://github.com/luizfiorimr/OncoSaas/issues/new?template=feature_request.md):

```markdown
**Qual problema sua sugestão resolve?**
Descrição clara do problema.

**Solução Proposta**
Como você resolveria?

**Alternativas Consideradas**
Outras soluções que você pensou.

**Contexto Adicional**
Screenshots, mockups, etc.
```

## Perguntas?

- 💬 **GitHub Discussions**: https://github.com/luizfiorimr/OncoSaas/discussions
- 📧 **Email**: dev@oncosaas.com
- 📖 **Documentação**: https://docs.oncosaas.com

---

**Obrigado por contribuir! 🎉**

Sua contribuição ajuda a melhorar o cuidado oncológico para milhares de pacientes.
