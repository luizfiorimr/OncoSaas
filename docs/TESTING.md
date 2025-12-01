# 🧪 Guia de Testes - OncoSaas

Este documento descreve as estratégias, ferramentas e padrões de testes do OncoSaas.

---

## Visão Geral

```
┌────────────────────────────────────────────────────────────────┐
│                     Pirâmide de Testes                         │
├────────────────────────────────────────────────────────────────┤
│                        E2E Tests                               │
│                    (Playwright/Cypress)                        │
│                          10%                                   │
├────────────────────────────────────────────────────────────────┤
│                   Integration Tests                            │
│                  (Supertest, TestContainers)                   │
│                          20%                                   │
├────────────────────────────────────────────────────────────────┤
│                      Unit Tests                                │
│            (Jest, React Testing Library, pytest)               │
│                          70%                                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Stack de Testes

| Componente | Framework | Cobertura Mínima |
|------------|-----------|------------------|
| Backend | Jest + Supertest | 70% |
| Frontend | Jest + React Testing Library | 70% |
| AI Service | pytest + pytest-asyncio | 70% |
| E2E | Playwright | Fluxos críticos |

---

## Backend (NestJS)

### Configuração

```javascript
// backend/jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
```

### Testes Unitários

```typescript
// backend/src/patients/patients.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsService } from './patients.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: PrismaService;

  // Mock do Prisma
  const mockPrisma = {
    patient: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
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
    prisma = module.get<PrismaService>(PrismaService);

    // Limpar mocks entre testes
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar pacientes filtrados por tenant', async () => {
      const tenantId = 'tenant-123';
      const mockPatients = [
        { id: '1', name: 'Maria Silva', tenantId },
        { id: '2', name: 'João Santos', tenantId },
      ];

      mockPrisma.patient.findMany.mockResolvedValue(mockPatients);

      const result = await service.findAll(tenantId);

      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockPatients);
      expect(result.length).toBe(2);
    });

    it('deve retornar array vazio se não houver pacientes', async () => {
      mockPrisma.patient.findMany.mockResolvedValue([]);

      const result = await service.findAll('tenant-vazio');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('deve retornar paciente por ID e tenant', async () => {
      const patient = { id: '1', name: 'Maria Silva', tenantId: 'tenant-123' };
      mockPrisma.patient.findFirst.mockResolvedValue(patient);

      const result = await service.findOne('1', 'tenant-123');

      expect(result).toEqual(patient);
      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant-123' },
      });
    });

    it('deve lançar NotFoundException se paciente não existir', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.findOne('999', 'tenant-123'))
        .rejects.toThrow(NotFoundException);
    });

    it('não deve retornar paciente de outro tenant', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.findOne('1', 'outro-tenant'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('deve criar paciente com tenantId', async () => {
      const dto = { name: 'Novo Paciente', phone: '11999998888' };
      const tenantId = 'tenant-123';
      const created = { id: '1', ...dto, tenantId };

      mockPrisma.patient.create.mockResolvedValue(created);

      const result = await service.create(dto, tenantId);

      expect(mockPrisma.patient.create).toHaveBeenCalledWith({
        data: { ...dto, tenantId },
      });
      expect(result.tenantId).toBe(tenantId);
    });
  });
});
```

### Testes de Integração (Controllers)

```typescript
// backend/src/patients/patients.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;
  let patientsService: PatientsService;

  const mockPatientsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Mock do Guard de autenticação
  const mockJwtAuthGuard = {
    canActivate: jest.fn().mockImplementation((context) => {
      const req = context.switchToHttp().getRequest();
      req.user = { id: 'user-1', tenantId: 'tenant-123', roles: ['nurse'] };
      return true;
    }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: mockPatientsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    await app.init();

    patientsService = module.get<PatientsService>(PatientsService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /patients', () => {
    it('deve retornar lista de pacientes', async () => {
      const mockPatients = [
        { id: '1', name: 'Maria', tenantId: 'tenant-123' },
      ];
      mockPatientsService.findAll.mockResolvedValue(mockPatients);

      const response = await request(app.getHttpServer())
        .get('/patients')
        .expect(200);

      expect(response.body).toEqual(mockPatients);
      expect(mockPatientsService.findAll).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('POST /patients', () => {
    it('deve criar paciente com dados válidos', async () => {
      const createDto = { name: 'Novo Paciente', phone: '11999998888' };
      const created = { id: '1', ...createDto, tenantId: 'tenant-123' };
      mockPatientsService.create.mockResolvedValue(created);

      const response = await request(app.getHttpServer())
        .post('/patients')
        .send(createDto)
        .expect(201);

      expect(response.body.name).toBe(createDto.name);
    });

    it('deve rejeitar dados inválidos', async () => {
      const response = await request(app.getHttpServer())
        .post('/patients')
        .send({ name: '' }) // nome vazio
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });
});
```

### Testes com TestContainers

```typescript
// backend/test/integration/patients.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PrismaService } from '@/prisma/prisma.service';
import { PatientsModule } from '@/patients/patients.module';
import * as request from 'supertest';

describe('Patients Integration (TestContainers)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // Iniciar container PostgreSQL
    container = await new PostgreSqlContainer()
      .withDatabase('oncosaas_test')
      .start();

    const module = await Test.createTestingModule({
      imports: [PatientsModule],
    })
      .overrideProvider(PrismaService)
      .useFactory({
        factory: () => {
          const prisma = new PrismaService({
            datasources: {
              db: { url: container.getConnectionUri() },
            },
          });
          return prisma;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    // Executar migrations
    const prisma = app.get(PrismaService);
    await prisma.$executeRaw`...migrations...`;
  }, 60000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('deve persistir paciente no banco', async () => {
    // Teste real com banco de dados
  });
});
```

### Comandos

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Arquivo específico
npm test -- patients.service.spec.ts

# Testes de integração
npm run test:e2e
```

---

## Frontend (Next.js + React)

### Configuração

```javascript
// frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// frontend/jest.setup.js
import '@testing-library/jest-dom';

// Mock do next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
```

### Testes de Componentes

```typescript
// frontend/src/components/patients/PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from './PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: '1',
    name: 'Maria Silva',
    phone: '11999998888',
    priority: 'HIGH',
    status: 'ACTIVE',
    riskScore: 75,
    tenantId: 'tenant-123',
  };

  it('deve renderizar informações do paciente', () => {
    render(<PatientCard patient={mockPatient} />);

    expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    expect(screen.getByText('11999998888')).toBeInTheDocument();
  });

  it('deve mostrar badge de prioridade alta', () => {
    render(<PatientCard patient={mockPatient} />);

    const badge = screen.getByText('ALTA');
    expect(badge).toHaveClass('bg-red-500');
  });

  it('deve chamar onClick ao clicar', () => {
    const handleClick = jest.fn();
    render(<PatientCard patient={mockPatient} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('article'));

    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('deve mostrar score de risco', () => {
    render(<PatientCard patient={mockPatient} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('deve aplicar className customizado', () => {
    const { container } = render(
      <PatientCard patient={mockPatient} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### Testes de Hooks

```typescript
// frontend/src/hooks/usePatients.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatients } from './usePatients';
import { patientsApi } from '@/services/api';

// Mock do API
jest.mock('@/services/api');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePatients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar pacientes com sucesso', async () => {
    const mockPatients = [
      { id: '1', name: 'Maria Silva' },
      { id: '2', name: 'João Santos' },
    ];

    (patientsApi.getAll as jest.Mock).mockResolvedValue(mockPatients);

    const { result } = renderHook(() => usePatients(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPatients);
  });

  it('deve tratar erro na requisição', async () => {
    (patientsApi.getAll as jest.Mock).mockRejectedValue(new Error('Erro de rede'));

    const { result } = renderHook(() => usePatients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### Testes de Formulários

```typescript
// frontend/src/components/patients/PatientForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientForm } from './PatientForm';

describe('PatientForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve submeter formulário com dados válidos', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/nome/i), 'Maria Silva');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');
    await user.type(screen.getByLabelText(/email/i), 'maria@email.com');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Maria Silva',
        phone: '11999998888',
        email: 'maria@email.com',
      });
    });
  });

  it('deve mostrar erro para nome vazio', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('deve validar formato de email', async () => {
    const user = userEvent.setup();
    render(<PatientForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/nome/i), 'Maria');
    await user.type(screen.getByLabelText(/email/i), 'email-invalido');

    await user.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão durante submit', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<PatientForm onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/nome/i), 'Maria Silva');
    await user.type(screen.getByLabelText(/telefone/i), '11999998888');

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
```

### Comandos

```bash
# Todos os testes
npm test

# Com coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Componente específico
npm test -- PatientCard.test.tsx
```

---

## AI Service (Python)

### Configuração

```ini
# ai-service/pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
```

```python
# ai-service/tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

@pytest.fixture
def client():
    from src.main import app
    with TestClient(app) as c:
        yield c

@pytest.fixture
def mock_openai():
    with patch('src.services.llm_service.openai') as mock:
        mock.ChatCompletion.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content='Resposta do LLM'))]
        )
        yield mock

@pytest.fixture
def sample_patient():
    return {
        'id': '1',
        'name': 'Maria Silva',
        'age': 65,
        'symptoms': ['dor', 'fadiga'],
        'cancer_type': 'colorectal',
        'stage': 'III',
    }
```

### Testes Unitários

```python
# ai-service/tests/test_priority_model.py
import pytest
from src.models.priority_model import PriorityModel

class TestPriorityModel:
    @pytest.fixture
    def model(self):
        return PriorityModel()
    
    def test_calculate_priority_high(self, model, sample_patient):
        """Paciente com sintomas graves deve ter prioridade alta"""
        sample_patient['symptoms'] = ['sangramento', 'dor intensa', 'febre']
        
        result = model.predict(sample_patient)
        
        assert result.score >= 70
        assert result.category == 'high'
    
    def test_calculate_priority_low(self, model, sample_patient):
        """Paciente estável deve ter prioridade baixa"""
        sample_patient['symptoms'] = []
        sample_patient['stage'] = 'I'
        
        result = model.predict(sample_patient)
        
        assert result.score <= 30
        assert result.category == 'low'
    
    def test_priority_increases_with_stage(self, model, sample_patient):
        """Estágios avançados devem ter maior prioridade"""
        sample_patient['stage'] = 'I'
        result_stage1 = model.predict(sample_patient)
        
        sample_patient['stage'] = 'IV'
        result_stage4 = model.predict(sample_patient)
        
        assert result_stage4.score > result_stage1.score
    
    def test_priority_with_missing_data(self, model):
        """Deve lidar com dados incompletos"""
        incomplete_patient = {'id': '1', 'name': 'Test'}
        
        result = model.predict(incomplete_patient)
        
        assert result.score == 50  # valor padrão
        assert result.category == 'medium'
```

### Testes de API

```python
# ai-service/tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from fastapi import status

class TestPriorityAPI:
    def test_calculate_priority_success(self, client, sample_patient):
        """POST /priority deve retornar score"""
        response = client.post('/api/v1/priority/calculate', json=sample_patient)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert 'score' in data
        assert 'category' in data
        assert 0 <= data['score'] <= 100
    
    def test_calculate_priority_invalid_data(self, client):
        """Deve rejeitar dados inválidos"""
        response = client.post('/api/v1/priority/calculate', json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_health_check(self, client):
        """GET /health deve retornar OK"""
        response = client.get('/health')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.json()['status'] == 'ok'

class TestAgentAPI:
    def test_process_message_success(self, client, mock_openai):
        """POST /agent/message deve processar mensagem"""
        payload = {
            'patient_id': '1',
            'message': 'Como estou me sentindo hoje?',
            'context': {'name': 'Maria'},
        }
        
        response = client.post('/api/v1/agent/message', json=payload)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'response' in response.json()
    
    def test_process_message_requires_patient_id(self, client):
        """Deve exigir patient_id"""
        response = client.post('/api/v1/agent/message', json={'message': 'Teste'})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
```

### Testes de RAG

```python
# ai-service/tests/test_rag.py
import pytest
from unittest.mock import MagicMock
from src.agent.rag import RAGRetriever

class TestRAGRetriever:
    @pytest.fixture
    def retriever(self):
        return RAGRetriever()
    
    def test_retrieve_relevant_documents(self, retriever):
        """Deve retornar documentos relevantes para query"""
        query = "sintomas de câncer colorretal"
        
        docs = retriever.retrieve(query, k=3)
        
        assert len(docs) <= 3
        assert all('content' in doc for doc in docs)
    
    def test_retrieve_with_filters(self, retriever):
        """Deve filtrar por tipo de câncer"""
        query = "tratamento"
        filters = {'cancer_type': 'colorectal'}
        
        docs = retriever.retrieve(query, filters=filters)
        
        for doc in docs:
            assert doc.metadata.get('cancer_type') == 'colorectal'
    
    def test_empty_query_returns_empty(self, retriever):
        """Query vazia deve retornar lista vazia"""
        docs = retriever.retrieve("")
        
        assert docs == []
```

### Comandos

```bash
# Todos os testes
pytest

# Com coverage
pytest --cov=src --cov-report=html

# Verbose
pytest -v

# Arquivo específico
pytest tests/test_priority_model.py

# Testes async
pytest -v --asyncio-mode=auto
```

---

## Testes E2E (Playwright)

### Configuração

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Testes E2E

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'enfermeira@hospital.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'usuario@invalido.com');
    await page.fill('[name="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// e2e/patients.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gerenciamento de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.fill('[name="email"]', 'enfermeira@hospital.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('deve listar pacientes', async ({ page }) => {
    await page.goto('/patients');

    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0);
  });

  test('deve criar novo paciente', async ({ page }) => {
    await page.goto('/patients');
    await page.click('button:has-text("Novo Paciente")');

    await page.fill('[name="name"]', 'Paciente Teste E2E');
    await page.fill('[name="phone"]', '11999997777');
    await page.fill('[name="email"]', 'teste@e2e.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Paciente criado')).toBeVisible();
    await expect(page.locator('text=Paciente Teste E2E')).toBeVisible();
  });

  test('deve filtrar pacientes por prioridade', async ({ page }) => {
    await page.goto('/patients');

    await page.selectOption('[name="priority"]', 'CRITICAL');

    await expect(page.locator('tbody tr')).toHaveCount.lessThan(10);
    await expect(page.locator('.badge-critical')).toBeVisible();
  });
});
```

```typescript
// e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'enfermeira@hospital.com');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('deve exibir lista de conversas', async ({ page }) => {
    await page.goto('/chat');

    await expect(page.locator('[data-testid="conversation-list"]')).toBeVisible();
  });

  test('deve enviar mensagem', async ({ page }) => {
    await page.goto('/chat');

    // Selecionar primeira conversa
    await page.click('[data-testid="conversation-item"]:first-child');

    // Digitar e enviar mensagem
    await page.fill('[data-testid="message-input"]', 'Mensagem de teste E2E');
    await page.click('[data-testid="send-button"]');

    await expect(page.locator('text=Mensagem de teste E2E')).toBeVisible();
  });
});
```

### Comandos

```bash
# Todos os testes
npx playwright test

# Com UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Arquivo específico
npx playwright test auth.spec.ts

# Projeto específico (chromium)
npx playwright test --project=chromium

# Gerar relatório
npx playwright show-report
```

---

## Cobertura de Código

### Requisitos Mínimos

| Componente | Cobertura |
|------------|-----------|
| Backend Services | 80% |
| Backend Controllers | 70% |
| Frontend Components | 70% |
| Frontend Hooks | 80% |
| AI Service Models | 80% |
| AI Service API | 70% |

### Comandos de Coverage

```bash
# Backend
cd backend && npm test -- --coverage

# Frontend
cd frontend && npm test -- --coverage

# AI Service
cd ai-service && pytest --cov=src --cov-report=html

# Relatório HTML
open coverage/lcov-report/index.html
```

---

## CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm test -- --coverage
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm test -- --coverage
      - uses: codecov/codecov-action@v3

  ai-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r ai-service/requirements.txt
      - run: cd ai-service && pytest --cov=src
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Boas Práticas

### Nomenclatura

```typescript
// ✅ Bom - descritivo e específico
describe('PatientsService', () => {
  describe('findAll', () => {
    it('deve retornar apenas pacientes do tenant especificado', () => {});
    it('deve ordenar pacientes por data de criação decrescente', () => {});
    it('deve retornar array vazio quando não houver pacientes', () => {});
  });
});

// ❌ Ruim - genérico
describe('service', () => {
  it('should work', () => {});
});
```

### Organização AAA

```typescript
// Arrange - Act - Assert
it('deve calcular prioridade corretamente', () => {
  // Arrange
  const patient = createMockPatient({ symptoms: ['dor'] });
  const service = new PriorityService();

  // Act
  const result = service.calculate(patient);

  // Assert
  expect(result.score).toBe(75);
});
```

### Testes Isolados

```typescript
// ✅ Bom - cada teste é independente
beforeEach(() => {
  jest.clearAllMocks();
});

// ❌ Ruim - testes dependentes
let sharedState;
test('primeiro', () => { sharedState = 1; });
test('segundo', () => { expect(sharedState).toBe(1); }); // depende do primeiro
```

### Mocks Focados

```typescript
// ✅ Bom - mock apenas o necessário
const mockPrisma = {
  patient: {
    findMany: jest.fn(),
  },
};

// ❌ Ruim - mock excessivo
const mockPrisma = {
  patient: { ...todosMétodos },
  user: { ...todosMétodos },
  // etc.
};
```
