# Diagrama ERD Visual - OncoSaaS

## Arquitetura Hierárquica do Banco de Dados

```mermaid
graph TD
    subgraph "Level 3: High-level - Database System"
        DB_MAIN[PostgreSQL Database<br/>Multi-tenant Architecture]
    end

    subgraph "Level 2: Mid-level - Schemas Principais"
        SCHEMA_TENANT[Tenant Schema<br/>Isolamento por Cliente]
        SCHEMA_SHARED[Shared Schema<br/>Dados Compartilhados]
    end

    subgraph "Level 1: Low-level - Entidades Principais"
        subgraph "Core Entities"
            ENT_TENANT[Tenant<br/>Hospitais/Clínicas]
            ENT_USER[User<br/>Usuários do Sistema]
            ENT_PATIENT[Patient<br/>Pacientes Oncológicos]
        end

        subgraph "Oncology Entities"
            ENT_JOURNEY[PatientJourney<br/>Jornada Oncológica]
            ENT_NAV[NavigationStep<br/>Etapas de Navegação]
            ENT_DIAG[CancerDiagnosis<br/>Diagnóstico]
            ENT_TREAT[Treatment<br/>Tratamentos]
        end

        subgraph "Communication Entities"
            ENT_MSG[Message<br/>Mensagens WhatsApp]
            ENT_OBS[Observation<br/>Observações FHIR]
            ENT_ALERT[Alert<br/>Sistema de Alertas]
        end

        subgraph "AI & ML Entities"
            ENT_PRIORITY[PriorityScore<br/>Scores de Priorização]
            ENT_QR[QuestionnaireResponse<br/>Respostas Questionários]
        end

        subgraph "Integration Entities"
            ENT_WHATSAPP[WhatsAppConnection<br/>Conexões WhatsApp]
            ENT_FHIR[FHIRIntegrationConfig<br/>Config FHIR]
        end

        subgraph "Audit Entities"
            ENT_AUDIT[AuditLog<br/>Logs de Auditoria]
            ENT_NOTE[InternalNote<br/>Notas Internas]
            ENT_INTERV[Intervention<br/>Intervenções]
        end
    end

    subgraph "Level 0: Infrastructure"
        INF_PRISMA[Prisma ORM<br/>Type-safe Queries]
        INF_INDEXES[Database Indexes<br/>Performance Optimization]
        INF_MIGRATIONS[Migrations<br/>Schema Versioning]
    end

    %% Level 3 -> Level 2
    DB_MAIN --> SCHEMA_TENANT
    DB_MAIN --> SCHEMA_SHARED

    %% Level 2 -> Level 1
    SCHEMA_TENANT --> ENT_TENANT
    SCHEMA_TENANT --> ENT_USER
    SCHEMA_TENANT --> ENT_PATIENT
    SCHEMA_TENANT --> ENT_JOURNEY
    SCHEMA_TENANT --> ENT_NAV
    SCHEMA_TENANT --> ENT_DIAG
    SCHEMA_TENANT --> ENT_TREAT
    SCHEMA_TENANT --> ENT_MSG
    SCHEMA_TENANT --> ENT_OBS
    SCHEMA_TENANT --> ENT_ALERT
    SCHEMA_TENANT --> ENT_PRIORITY
    SCHEMA_TENANT --> ENT_QR
    SCHEMA_TENANT --> ENT_WHATSAPP
    SCHEMA_TENANT --> ENT_FHIR
    SCHEMA_TENANT --> ENT_AUDIT
    SCHEMA_TENANT --> ENT_NOTE
    SCHEMA_TENANT --> ENT_INTERV

    %% Level 1 -> Level 0
    ENT_TENANT --> INF_PRISMA
    ENT_USER --> INF_PRISMA
    ENT_PATIENT --> INF_PRISMA
    ENT_JOURNEY --> INF_PRISMA
    ENT_NAV --> INF_PRISMA
    ENT_DIAG --> INF_PRISMA
    ENT_TREAT --> INF_PRISMA
    ENT_MSG --> INF_PRISMA
    ENT_OBS --> INF_PRISMA
    ENT_ALERT --> INF_PRISMA
    ENT_PRIORITY --> INF_PRISMA

    ENT_PATIENT --> INF_INDEXES
    ENT_NAV --> INF_INDEXES
    ENT_ALERT --> INF_INDEXES
    ENT_MSG --> INF_INDEXES

    INF_PRISMA --> INF_MIGRATIONS

    style DB_MAIN fill:#336791,stroke:#333,stroke-width:3px
    style SCHEMA_TENANT fill:#4a90e2,stroke:#333,stroke-width:2px
    style ENT_PATIENT fill:#50e3c2,stroke:#333,stroke-width:2px
    style ENT_ALERT fill:#d0021b,stroke:#333,stroke-width:2px
    style ENT_PRIORITY fill:#f5a623,stroke:#333,stroke-width:2px
```

## Diagrama de Relacionamentos - Core Entities

```mermaid
graph LR
    subgraph "Core Domain"
        T[Tenant<br/>🏥 Hospital/Clínica]
        U[User<br/>👤 Usuário]
        P[Patient<br/>👨‍⚕️ Paciente]
    end

    subgraph "Oncology Domain"
        PJ[PatientJourney<br/>📋 Jornada]
        NS[NavigationStep<br/>📍 Etapa]
        CD[CancerDiagnosis<br/>🔬 Diagnóstico]
        TR[Treatment<br/>💊 Tratamento]
    end

    subgraph "Communication Domain"
        M[Message<br/>💬 Mensagem]
        O[Observation<br/>📊 Observação]
        A[Alert<br/>🚨 Alerta]
    end

    subgraph "AI Domain"
        PS[PriorityScore<br/>🎯 Score]
        QR[QuestionnaireResponse<br/>📝 Questionário]
    end

    T -->|1:N| U
    T -->|1:N| P
    P -->|1:1| PJ
    P -->|1:N| NS
    P -->|1:N| CD
    P -->|1:N| TR
    P -->|1:N| M
    P -->|1:N| O
    P -->|1:N| A
    P -->|1:N| PS
    P -->|1:N| QR

    PJ -->|1:N| NS
    CD -->|1:N| TR
    M -->|1:N| O
    M -->|1:N| A

    style T fill:#4a90e2
    style P fill:#50e3c2
    style A fill:#d0021b
    style PS fill:#f5a623
```

## Diagrama de Sequência - Operação Completa no Banco

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuário
    participant BE as ⚙️ Backend
    participant PRISMA as Prisma ORM
    participant PG as 💾 PostgreSQL

    Note over U,PG: 1. Criação de Paciente

    U->>BE: POST /api/v1/patients<br/>{name, cancerType, ...}
    BE->>PRISMA: prisma.patient.create({<br/>  data: { tenantId, name, ... }<br/>})
    PRISMA->>PG: INSERT INTO Patient<br/>(tenantId, name, cancerType, ...)
    PG-->>PRISMA: Patient criado (id)
    PRISMA-->>BE: Patient object
    BE-->>U: { id, name, ... }

    Note over U,PG: 2. Criação de Jornada Oncológica

    BE->>PRISMA: prisma.patientJourney.create({<br/>  data: { patientId, ... }<br/>})
    PRISMA->>PG: INSERT INTO PatientJourney<br/>(patientId, currentStep, ...)
    PG-->>PRISMA: PatientJourney criado

    BE->>PRISMA: prisma.navigationStep.createMany({<br/>  data: [etapas...]<br/>})
    PRISMA->>PG: INSERT INTO NavigationStep<br/>(múltiplas linhas)
    PG-->>PRISMA: NavigationSteps criadas

    Note over U,PG: 3. Query com Relacionamentos

    U->>BE: GET /api/v1/patients/:id
    BE->>PRISMA: prisma.patient.findUnique({<br/>  where: { id, tenantId },<br/>  include: {<br/>    journey: true,<br/>    navigationSteps: true,<br/>    alerts: true<br/>  }<br/>})
    PRISMA->>PG: SELECT Patient<br/>LEFT JOIN PatientJourney<br/>LEFT JOIN NavigationStep<br/>LEFT JOIN Alert<br/>WHERE id=? AND tenantId=?
    PG-->>PRISMA: Dados relacionados
    PRISMA-->>BE: Patient com relacionamentos
    BE-->>U: { patient, journey, steps, alerts }

    Note over U,PG: 4. Transação (Múltiplas Operações)

    U->>BE: POST /api/v1/patients/:id/complete-step
    BE->>PRISMA: prisma.$transaction([<br/>  prisma.navigationStep.update({<br/>    where: { id },<br/>    data: { isCompleted: true }<br/>  }),<br/>  prisma.alert.create({<br/>    data: { type: 'STEP_COMPLETED' }<br/>  })<br/>])
    PRISMA->>PG: BEGIN TRANSACTION
    PRISMA->>PG: UPDATE NavigationStep
    PRISMA->>PG: INSERT INTO Alert
    PRISMA->>PG: COMMIT
    PG-->>PRISMA: Transação completa
    PRISMA-->>BE: Resultado
    BE-->>U: ✅ Etapa completada
```

## Diagrama de Índices e Performance

```mermaid
graph TB
    subgraph "📊 Tabelas Principais"
        T1[Patient<br/>Índices: tenantId,<br/>priorityScore, status]
        T2[NavigationStep<br/>Índices: tenantId,<br/>patientId, dueDate]
        T3[Alert<br/>Índices: tenantId,<br/>status, severity]
        T4[Message<br/>Índices: tenantId,<br/>patientId, timestamp]
    end

    subgraph "🔍 Tipos de Índices"
        I1[Primary Key<br/>id - UUID]
        I2[Foreign Key<br/>tenantId, patientId]
        I3[Composite Index<br/>cancerType + journeyStage]
        I4[Performance Index<br/>priorityScore, dueDate]
    end

    T1 --> I1
    T1 --> I2
    T1 --> I4

    T2 --> I1
    T2 --> I2
    T2 --> I3
    T2 --> I4

    T3 --> I1
    T3 --> I2
    T3 --> I4

    T4 --> I1
    T4 --> I2
    T4 --> I4

    style T1 fill:#50e3c2
    style T2 fill:#4a90e2
    style T3 fill:#d0021b
    style T4 fill:#f5a623
```

## Fluxo de Dados - Multi-tenancy

```mermaid
sequenceDiagram
    participant U1 as 👤 Usuário Tenant A
    participant U2 as 👤 Usuário Tenant B
    participant BE as ⚙️ Backend
    participant PG as 💾 PostgreSQL

    Note over U1,PG: Isolamento por Tenant

    U1->>BE: GET /api/v1/patients<br/>(tenantId: "tenant-a")
    BE->>PG: SELECT * FROM Patient<br/>WHERE tenantId = 'tenant-a'
    PG-->>BE: Apenas pacientes Tenant A
    BE-->>U1: Lista de pacientes A

    U2->>BE: GET /api/v1/patients<br/>(tenantId: "tenant-b")
    BE->>PG: SELECT * FROM Patient<br/>WHERE tenantId = 'tenant-b'
    PG-->>BE: Apenas pacientes Tenant B
    BE-->>U2: Lista de pacientes B

    Note over U1,PG: Tentativa de Acesso Não Autorizado

    U1->>BE: GET /api/v1/patients/:id<br/>(id de paciente Tenant B)
    BE->>PG: SELECT * FROM Patient<br/>WHERE id = ? AND tenantId = 'tenant-a'
    PG-->>BE: Nenhum resultado
    BE-->>U1: 404 Not Found<br/>(Segurança garantida)
```

## Estrutura de Dados - Visão Simplificada

```mermaid
graph TB
    subgraph "🏥 Tenant (Hospital/Clínica)"
        TENANT[Tenant<br/>id, name, schemaName]
    end

    subgraph "👤 Usuários"
        USER[User<br/>id, tenantId, email, role]
    end

    subgraph "👨‍⚕️ Paciente"
        PATIENT[Patient<br/>id, tenantId, name,<br/>cancerType, priorityScore]
    end

    subgraph "📋 Jornada Oncológica"
        JOURNEY[PatientJourney<br/>id, patientId,<br/>currentStep, nextStep]
        STEP[NavigationStep<br/>id, patientId, journeyId,<br/>stepKey, status, dueDate]
    end

    subgraph "💬 Comunicação"
        MSG[Message<br/>id, patientId,<br/>content, direction]
        OBS[Observation<br/>id, patientId,<br/>code, value, fhirResourceId]
    end

    subgraph "🚨 Alertas"
        ALERT[Alert<br/>id, patientId,<br/>type, severity, status]
    end

    subgraph "🎯 Priorização"
        PRIORITY[PriorityScore<br/>id, patientId,<br/>score, category]
    end

    TENANT --> USER
    TENANT --> PATIENT
    PATIENT --> JOURNEY
    PATIENT --> STEP
    PATIENT --> MSG
    PATIENT --> OBS
    PATIENT --> ALERT
    PATIENT --> PRIORITY
    JOURNEY --> STEP
    MSG --> OBS
    MSG --> ALERT

    style TENANT fill:#4a90e2
    style PATIENT fill:#50e3c2
    style ALERT fill:#d0021b
    style PRIORITY fill:#f5a623
```

## Observações Importantes

### Multi-tenancy

- Todos os modelos (exceto `Tenant`) incluem `tenantId`
- Isolamento garantido em todas as queries
- Schema por tenant para escalabilidade

### Índices Principais

- `tenantId` - Isolamento multi-tenant
- `patientId` - Relacionamentos com pacientes
- `priorityScore` - Ordenação e filtros
- `dueDate` - Detecção de atrasos
- `status` - Filtros por status

### Relacionamentos Críticos

- `Patient` → `PatientJourney` (1:1)
- `PatientJourney` → `NavigationStep` (1:N)
- `Patient` → `Message` (1:N)
- `Message` → `Observation` (1:N)
- `Patient` → `Alert` (1:N)

### Performance

- Índices compostos para queries complexas
- Paginação em todas as listagens
- Cache de queries frequentes (React Query)
- Otimização de N+1 queries (Prisma `include`)
