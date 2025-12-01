# 💻 Guia de Desenvolvimento - OncoSaas

Este guia contém padrões de código, convenções e boas práticas para desenvolvimento no OncoSaas.

---

## Estrutura do Projeto

```
OncoSaas/
├── frontend/           # Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/       # Rotas e páginas
│   │   ├── components/# Componentes React
│   │   ├── hooks/     # Custom hooks
│   │   ├── lib/       # Utilitários
│   │   └── stores/    # Zustand stores
│   └── package.json
├── backend/            # NestJS
│   ├── src/
│   │   ├── modules/   # Módulos de feature
│   │   ├── common/    # Código compartilhado
│   │   ├── gateways/  # WebSocket
│   │   └── prisma/    # Prisma service
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── ai-service/         # FastAPI (Python)
│   ├── src/
│   │   ├── api/       # Rotas
│   │   ├── models/    # ML models
│   │   └── agent/     # WhatsApp agent
│   └── requirements.txt
└── docs/               # Documentação
```

---

## Frontend (Next.js 14)

### Componentes React

**Estrutura de um componente**:
```tsx
// src/components/dashboard/PatientCard.tsx
'use client'; // Apenas se precisar de interatividade

import { cn } from '@/lib/utils';

interface PatientCardProps {
  patient: Patient;
  onClick?: (id: string) => void;
  className?: string;
}

export function PatientCard({ 
  patient, 
  onClick, 
  className 
}: PatientCardProps) {
  return (
    <div 
      className={cn('border rounded-lg p-4', className)}
      onClick={() => onClick?.(patient.id)}
    >
      <h3 className="font-semibold">{patient.name}</h3>
      {/* ... */}
    </div>
  );
}
```

**Regras**:
- ✅ Componentes funcionais com TypeScript
- ✅ Props tipadas com interface
- ✅ Um componente por arquivo
- ✅ Nome do arquivo = nome do componente
- ❌ Componentes de classe
- ❌ `any` em props

### Custom Hooks

```tsx
// src/hooks/usePatients.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function usePatients(params?: PatientsParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => api.patients.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
}

// Uso
const { data, isLoading, error } = usePatients({ priority: 'critical' });
```

### Estado Global (Zustand)

```tsx
// src/stores/patient-store.ts
import { create } from 'zustand';

interface PatientStore {
  selectedPatientId: string | null;
  setSelectedPatient: (id: string | null) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  selectedPatientId: null,
  setSelectedPatient: (id) => set({ selectedPatientId: id }),
}));

// Uso
const { selectedPatientId, setSelectedPatient } = usePatientStore();
```

### Formulários

```tsx
// Usar React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}
```

### Estilização

```tsx
// Usar Tailwind CSS + cn() para classes condicionais
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg border',
  isActive && 'border-blue-500',
  isError && 'border-red-500'
)}>
```

---

## Backend (NestJS)

### Estrutura de Módulo

```
modules/patients/
├── patients.module.ts      # Módulo NestJS
├── patients.controller.ts  # Endpoints
├── patients.service.ts     # Lógica de negócio
├── dto/
│   ├── create-patient.dto.ts
│   └── update-patient.dto.ts
└── patients.service.spec.ts # Testes
```

### Controller

```typescript
// patients.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard) // Sempre usar guard
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  async findAll(@Request() req) {
    // Sempre passar tenantId
    return this.patientsService.findAll(req.user.tenantId);
  }

  @Post()
  async create(@Body() dto: CreatePatientDto, @Request() req) {
    return this.patientsService.create(dto, req.user.tenantId);
  }
}
```

### Service

```typescript
// patients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.patient.findMany({
      where: { tenantId }, // SEMPRE incluir tenantId
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, tenantId }, // SEMPRE incluir tenantId
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }
}
```

### DTO com Validação

```typescript
// dto/create-patient.dto.ts
import { IsString, IsEmail, IsDateString, IsNotEmpty, IsIn } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsIn(['male', 'female', 'other'])
  gender: string;

  @IsEmail()
  email?: string;
}
```

### Multi-Tenancy

```typescript
// SEMPRE incluir tenantId em queries
// ✅ Correto
const patients = await this.prisma.patient.findMany({
  where: { tenantId: req.user.tenantId },
});

// ❌ Errado - Falta tenantId
const patients = await this.prisma.patient.findMany();
```

---

## AI Service (Python/FastAPI)

### Estrutura de Rota

```python
# api/routes/priority.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel

router = APIRouter(prefix="/priority", tags=["priority"])

class PriorityRequest(BaseModel):
    patient_id: str
    symptoms: list[str]
    vitals: dict

class PriorityResponse(BaseModel):
    score: float
    category: str
    factors: list[str]

@router.post("/calculate", response_model=PriorityResponse)
async def calculate_priority(request: PriorityRequest):
    # Lógica de priorização
    return PriorityResponse(
        score=75.5,
        category="high",
        factors=["dor intensa", "exame atrasado"]
    )
```

### Schemas Pydantic

```python
# schemas/patient.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class PatientBase(BaseModel):
    name: str = Field(..., min_length=1)
    phone: str
    
class PatientCreate(PatientBase):
    date_of_birth: datetime
    gender: str = Field(..., pattern="^(male|female|other)$")

class Patient(PatientBase):
    id: str
    tenant_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `PatientCard.tsx` |
| Hooks | camelCase + use | `usePatients.ts` |
| Módulos NestJS | kebab-case | `patients.service.ts` |
| DTOs | kebab-case | `create-patient.dto.ts` |
| Python | snake_case | `priority_model.py` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Variáveis | camelCase (JS) / snake_case (Python) | `patientName` / `patient_name` |

### TypeScript

```typescript
// Interfaces para props e dados
interface Patient {
  id: string;
  name: string;
  tenantId: string;
}

// Type para unions
type Priority = 'critical' | 'high' | 'medium' | 'low';

// Enums quando necessário
enum JourneyStage {
  SCREENING = 'SCREENING',
  DIAGNOSIS = 'DIAGNOSIS',
  TREATMENT = 'TREATMENT',
  FOLLOW_UP = 'FOLLOW_UP',
}
```

### Imports

```typescript
// 1. Externos
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internos (@/)
import { Button } from '@/components/ui/button';
import { usePatients } from '@/hooks/usePatients';

// 3. Relativos
import { PatientCard } from './PatientCard';
import type { PatientCardProps } from './types';
```

---

## Git Workflow

### Branches

```
main        # Produção
├── develop # Desenvolvimento
    ├── feature/add-patient-search    # Novas features
    ├── fix/login-redirect-bug        # Correções
    └── docs/update-api-documentation # Documentação
```

### Commits

Formato: `tipo(escopo): descrição`

```bash
feat(patients): adiciona filtro por prioridade
fix(auth): corrige redirecionamento após login
docs(api): atualiza documentação de endpoints
refactor(dashboard): extrai componente MetricsCard
test(patients): adiciona testes para PatientService
chore(deps): atualiza dependências do projeto
```

### Pull Request

1. Crie branch a partir de `develop`
2. Faça suas alterações
3. Rode testes localmente
4. Abra PR para `develop`
5. Aguarde code review
6. Faça merge após aprovação

---

## Testes

### Frontend (Jest + Testing Library)

```tsx
// __tests__/PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from '@/components/dashboard/PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: '1',
    name: 'Maria Silva',
    phone: '+5511999999999',
  };

  it('renders patient name', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<PatientCard patient={mockPatient} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('1');
  });
});
```

### Backend (Jest)

```typescript
// patients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  const mockPrisma = {
    patient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should return patients filtered by tenant', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([]);
    
    await service.findAll('tenant-1');
    
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});
```

### AI Service (pytest)

```python
# tests/test_priority.py
import pytest
from src.models.priority_model import PriorityModel

def test_calculate_priority():
    model = PriorityModel()
    
    result = model.calculate({
        "symptoms": ["dor intensa"],
        "days_since_last_exam": 30,
    })
    
    assert 0 <= result.score <= 100
    assert result.category in ["critical", "high", "medium", "low"]
```

---

## Comandos de Desenvolvimento

### Backend

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Testes
npm run test
npm run test:watch
npm run test:cov

# Lint
npm run lint
npm run format

# Prisma
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:studio
npm run prisma:seed
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Testes
npm run test
npm run test:watch

# Lint
npm run lint
npm run format

# Type check
npm run type-check
```

### AI Service

```bash
# Desenvolvimento
uvicorn main:app --reload

# Testes
pytest
pytest --cov=src

# Lint
pylint src/
black src/
```

---

## Debug

### VSCode Launch Config

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend"
    },
    {
      "name": "Frontend Debug",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend"
    }
  ]
}
```

### Logs

```typescript
// Backend - usar Logger do NestJS
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(PatientsService.name);

this.logger.log('Creating patient', { name: dto.name });
this.logger.error('Failed to create patient', error.stack);
```

```tsx
// Frontend - usar console apropriado
console.log('[Patients] Loading...', { page, limit });
console.error('[Patients] Error:', error);
```

---

## Performance

### Backend

- Use paginação em todas as listas
- Inclua índices no Prisma para campos de busca
- Use `include` ao invés de queries separadas
- Cache com Redis quando apropriado

### Frontend

- Use React Query para cache de servidor
- Lazy loading de componentes pesados
- Memoização com `useMemo`/`useCallback`
- Virtualization para listas longas

---

## Segurança

### NUNCA faça:

```typescript
// ❌ Query sem tenantId
const patients = await prisma.patient.findMany();

// ❌ SQL raw sem sanitização
await prisma.$queryRaw`SELECT * FROM patients WHERE id = ${id}`;

// ❌ Expor stack trace em produção
res.status(500).json({ error: error.stack });

// ❌ Logar dados sensíveis
console.log('User:', { password: user.password });
```

### SEMPRE faça:

```typescript
// ✅ Incluir tenantId
const patients = await prisma.patient.findMany({
  where: { tenantId }
});

// ✅ Usar Prisma typed queries
await prisma.patient.findUnique({ where: { id } });

// ✅ Mensagens genéricas em produção
res.status(500).json({ error: 'Internal server error' });

// ✅ Logar apenas o necessário
logger.log('User created', { userId: user.id });
```

---

## Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)
