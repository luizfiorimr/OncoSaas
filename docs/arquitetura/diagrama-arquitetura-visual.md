# Diagrama de Arquitetura Visual - OncoSaaS

## Arquitetura Hierárquica - Visão em Camadas

```mermaid
graph TD
    subgraph "Level 3: High-level - Aplicação Principal"
        MAIN[OncoSaaS Platform<br/>Sistema de Navegação Oncológica]
    end

    subgraph "Level 2: Mid-level - Sistemas Principais"
        FE_SYS[Frontend System<br/>Next.js 14 + React]
        BE_SYS[Backend System<br/>NestJS API]
        AI_SYS[AI System<br/>FastAPI]
        DB_SYS[Database System<br/>PostgreSQL]
    end

    subgraph "Level 1: Low-level - Componentes Específicos"
        subgraph "Frontend Components"
            FE_UI[UI Components<br/>Dashboard, Forms, Tables]
            FE_STATE[State Management<br/>Zustand + React Query]
            FE_WS[WebSocket Client<br/>Socket.io]
        end

        subgraph "Backend Modules"
            BE_AUTH[AuthService<br/>JWT, RBAC, MFA]
            BE_PATIENT[PatientService<br/>CRUD, Business Logic]
            BE_MSG[MessageService<br/>WhatsApp Integration]
            BE_ALERT[AlertService<br/>Alert Management]
            BE_NAV[NavigationService<br/>Oncology Navigation]
            BE_PRIORITY[PriorityService<br/>Score Calculation]
        end

        subgraph "Backend Infrastructure"
            BE_WS[WebSocket Gateway<br/>Real-time Updates]
            BE_CRON[Cron Scheduler<br/>Scheduled Tasks]
            BE_FHIR[FHIR Client<br/>EHR Integration]
        end

        subgraph "AI Services"
            AI_PRIORITY[Priority Model<br/>XGBoost ML]
            AI_AGENT[WhatsApp Agent<br/>LLM Conversation]
            AI_RAG[RAG System<br/>Medical Knowledge]
            AI_STT[Speech-to-Text<br/>Whisper]
        end

        subgraph "Database Layer"
            DB_PRISMA[Prisma ORM<br/>Type-safe Queries]
            DB_SCHEMA[Multi-tenant Schema<br/>Isolation per Tenant]
        end
    end

    subgraph "Level 0: External Services"
        EXT_WHATSAPP[WhatsApp Business API<br/>Meta/Facebook]
        EXT_OPENAI[OpenAI API<br/>GPT-4, Whisper]
        EXT_ANTHROPIC[Anthropic API<br/>Claude]
        EXT_FHIR[FHIR Server<br/>External EHR]
        EXT_S3[S3/MinIO<br/>File Storage]
    end

    %% Level 3 -> Level 2
    MAIN --> FE_SYS
    MAIN --> BE_SYS
    MAIN --> AI_SYS
    MAIN --> DB_SYS

    %% Level 2 -> Level 1
    FE_SYS --> FE_UI
    FE_SYS --> FE_STATE
    FE_SYS --> FE_WS

    BE_SYS --> BE_AUTH
    BE_SYS --> BE_PATIENT
    BE_SYS --> BE_MSG
    BE_SYS --> BE_ALERT
    BE_SYS --> BE_NAV
    BE_SYS --> BE_PRIORITY
    BE_SYS --> BE_WS
    BE_SYS --> BE_CRON
    BE_SYS --> BE_FHIR

    AI_SYS --> AI_PRIORITY
    AI_SYS --> AI_AGENT
    AI_SYS --> AI_RAG
    AI_SYS --> AI_STT

    DB_SYS --> DB_PRISMA
    DB_SYS --> DB_SCHEMA

    %% Level 1 -> Level 0
    BE_AUTH --> DB_PRISMA
    BE_PATIENT --> DB_PRISMA
    BE_MSG --> EXT_WHATSAPP
    BE_FHIR --> EXT_FHIR
    BE_PRIORITY --> AI_PRIORITY
    BE_MSG --> AI_AGENT

    AI_AGENT --> EXT_OPENAI
    AI_AGENT --> EXT_ANTHROPIC
    AI_STT --> EXT_OPENAI
    AI_RAG --> EXT_OPENAI

    BE_MSG --> EXT_S3
    AI_STT --> EXT_S3

    style MAIN fill:#4a90e2,stroke:#333,stroke-width:3px
    style FE_SYS fill:#61dafb,stroke:#333,stroke-width:2px
    style BE_SYS fill:#e0234e,stroke:#333,stroke-width:2px
    style AI_SYS fill:#00d4aa,stroke:#333,stroke-width:2px
    style DB_SYS fill:#336791,stroke:#333,stroke-width:2px
```

## Diagrama de Sequência - Fluxo Completo de Mensagem WhatsApp

```mermaid
sequenceDiagram
    autonumber
    participant P as 👤 Paciente<br/>(WhatsApp)
    participant WA as 📱 WhatsApp API<br/>(Meta)
    participant BE as ⚙️ Backend<br/>(NestJS)
    participant AI as 🤖 AI Service<br/>(FastAPI)
    participant DB as 💾 PostgreSQL
    participant WS as 🔌 WebSocket
    participant FE as 🌐 Frontend<br/>(Dashboard)
    participant N as 👨‍⚕️ Enfermeiro

    Note over P,N: 1. Recebimento de Mensagem

    P->>WA: Envia mensagem<br/>(texto ou áudio)
    WA->>BE: POST /webhook<br/>{message, from, type}

    Note over BE,DB: 2. Armazenamento e Processamento

    BE->>DB: INSERT Message<br/>(tenantId, patientId, content)
    DB-->>BE: Message salva (id: "msg-123")

    BE->>BE: Identifica paciente<br/>por phoneHash

    Note over BE,AI: 3. Processamento com IA

    BE->>AI: POST /api/v1/agent/process<br/>{messageId, content, audioUrl}

    alt Mensagem é áudio
        AI->>AI: Whisper API<br/>Transcrição
        AI->>AI: Texto transcrito
    end

    AI->>AI: RAG System<br/>Busca conhecimento médico
    AI->>AI: Analisa sintomas<br/>Extrai dados estruturados
    AI->>AI: Detecta sintomas críticos

    AI-->>BE: {response, structuredData,<br/>criticalSymptoms, observations}

    Note over BE,DB: 4. Salvamento de Dados

    BE->>DB: INSERT Observation<br/>(FHIR format)
    BE->>DB: UPDATE Patient<br/>(última interação)

    alt Sintoma crítico detectado
        BE->>DB: INSERT Alert<br/>(type: CRITICAL_SYMPTOM,<br/>severity: HIGH)
        DB-->>BE: Alert criado

        BE->>WS: Emit 'critical_alert'<br/>Room: tenant:{tenantId}
        WS->>FE: Notificação em tempo real
        FE->>N: 🔔 Alerta visual/sonoro

        Note over N,BE: 5. Intervenção Manual

        N->>FE: Visualiza alerta
        FE->>BE: GET /api/v1/alerts/:id
        BE->>DB: SELECT Alert WHERE id=?
        DB-->>BE: Dados do alerta
        BE-->>FE: Alert details

        N->>FE: Assume conversa
        FE->>BE: POST /api/v1/messages/:id/assume<br/>{userId}
        BE->>DB: UPDATE Message<br/>SET assumedBy=userId,<br/>processedBy='MANUAL'
        BE->>AI: Desativa agente<br/>para este paciente

        N->>FE: Digita resposta
        FE->>BE: POST /api/v1/messages<br/>{patientId, content, direction: 'OUTBOUND'}
        BE->>DB: INSERT Message<br/>(resposta manual)
        BE->>WA: POST /messages<br/>{to, text}
        WA->>P: Entrega mensagem
    else Sem sintoma crítico
        BE->>WA: POST /messages<br/>{to, text: response}
        WA->>P: Entrega resposta automática
    end

    Note over BE,DB: 6. Atualização de Priorização

    BE->>AI: POST /api/v1/priority/calculate<br/>{patientId, symptoms}
    AI->>AI: XGBoost Model<br/>Calcula score
    AI-->>BE: {score: 75, category: "HIGH"}

    BE->>DB: UPDATE Patient<br/>SET priorityScore=75,<br/>priorityCategory='HIGH'
    BE->>DB: INSERT PriorityScore<br/>(histórico)

    alt Score mudou significativamente
        BE->>DB: INSERT Alert<br/>(type: SCORE_CHANGE)
        BE->>WS: Emit 'score_change'
        WS->>FE: Notifica mudança
    end
```

## Diagrama de Sequência - Criação de Paciente e Navegação Oncológica

```mermaid
sequenceDiagram
    autonumber
    participant U as 👤 Usuário<br/>(Enfermeiro)
    participant FE as 🌐 Frontend
    participant BE as ⚙️ Backend
    participant NAV as NavigationService
    participant AI as 🤖 AI Service
    participant DB as 💾 PostgreSQL
    participant WS as 🔌 WebSocket

    Note over U,WS: 1. Criação de Paciente

    U->>FE: Preenche formulário<br/>{name, cancerType: "COLORECTAL"}
    FE->>BE: POST /api/v1/patients<br/>{name, cancerType, ...}

    BE->>DB: INSERT INTO Patient<br/>(tenantId, name, cancerType)
    DB-->>BE: Patient criado (id: "pat-123")

    Note over BE,NAV: 2. Criação de Jornada Oncológica

    BE->>NAV: createPatientJourney(patientId, cancerType)
    NAV->>DB: INSERT INTO PatientJourney<br/>(patientId, currentStep: "DIAGNOSIS")
    DB-->>NAV: PatientJourney criado

    NAV->>NAV: Gera NavigationSteps<br/>baseado em cancerType
    NAV->>DB: INSERT INTO NavigationStep<br/>(múltiplas etapas)

    Note over DB: Etapas criadas:<br/>- Colonoscopia (dueDate: +14 dias)<br/>- Laudo patológico (dueDate: +21 dias)<br/>- TC abdome/pelve (dueDate: +28 dias)

    DB-->>NAV: NavigationSteps criadas
    NAV-->>BE: Jornada criada

    Note over BE,AI: 3. Cálculo de Priorização Inicial

    BE->>AI: POST /api/v1/priority/calculate<br/>{patientId, cancerType, stage}
    AI->>AI: XGBoost Model<br/>Calcula score
    AI-->>BE: {score: 65, category: "HIGH"}

    BE->>DB: UPDATE Patient<br/>SET priorityScore=65,<br/>priorityCategory='HIGH'
    BE->>DB: INSERT INTO PriorityScore<br/>(patientId, score, category)

    BE-->>FE: Patient criado + Jornada
    FE-->>U: ✅ Paciente criado com sucesso

    Note over BE,WS: 4. Monitoramento de Atrasos (Cron Job)

    BE->>DB: SELECT NavigationStep<br/>WHERE dueDate < NOW()<br/>AND status != 'COMPLETED'<br/>AND tenantId = ?
    DB-->>BE: Etapas atrasadas<br/>[Colonoscopia - 2 dias atrasada]

    BE->>DB: INSERT INTO Alert<br/>(type: NAVIGATION_DELAY,<br/>severity: HIGH, patientId)
    DB-->>BE: Alert criado

    BE->>WS: Emit 'critical_alert'<br/>Room: tenant:{tenantId}
    WS->>FE: Notifica enfermeiros<br/>via WebSocket
    FE->>U: 🔔 Novo alerta de atraso
```

## Diagrama de Componentes - Visão Detalhada

```mermaid
graph LR
    subgraph "🌐 Frontend Layer"
        FE_APP[Next.js App<br/>App Router]
        FE_PAGES[Pages<br/>Dashboard, Patients, Alerts]
        FE_COMP[Components<br/>UI, Forms, Tables]
        FE_HOOKS[Hooks<br/>usePatients, useAlerts]
        FE_API[API Client<br/>Axios + Interceptors]
    end

    subgraph "⚙️ Backend Layer"
        BE_APP[NestJS App<br/>Main Application]
        BE_MODULES[Modules<br/>Auth, Patients, Messages]
        BE_SERVICES[Services<br/>Business Logic]
        BE_CONTROLLERS[Controllers<br/>HTTP Endpoints]
        BE_GUARDS[Guards<br/>JWT, RBAC, Tenant]
        BE_GATEWAYS[Gateways<br/>WebSocket]
    end

    subgraph "🤖 AI Layer"
        AI_APP[FastAPI App<br/>Main Application]
        AI_ROUTES[Routes<br/>/priority, /agent]
        AI_MODELS[ML Models<br/>XGBoost, Embeddings]
        AI_AGENTS[Agents<br/>WhatsApp Agent, RAG]
    end

    subgraph "💾 Data Layer"
        DB_POSTGRES[(PostgreSQL<br/>Multi-tenant)]
        DB_PRISMA[Prisma Client<br/>Type-safe ORM]
        DB_MIGRATIONS[Migrations<br/>Schema Versioning]
    end

    FE_APP --> FE_PAGES
    FE_PAGES --> FE_COMP
    FE_COMP --> FE_HOOKS
    FE_HOOKS --> FE_API
    FE_API -->|HTTPS| BE_CONTROLLERS

    BE_APP --> BE_MODULES
    BE_MODULES --> BE_SERVICES
    BE_MODULES --> BE_CONTROLLERS
    BE_CONTROLLERS --> BE_GUARDS
    BE_CONTROLLERS --> BE_GATEWAYS
    BE_SERVICES -->|HTTP| AI_ROUTES
    BE_SERVICES --> DB_PRISMA

    AI_APP --> AI_ROUTES
    AI_ROUTES --> AI_MODELS
    AI_ROUTES --> AI_AGENTS

    DB_PRISMA --> DB_POSTGRES
    DB_MIGRATIONS --> DB_POSTGRES

    style FE_APP fill:#61dafb
    style BE_APP fill:#e0234e
    style AI_APP fill:#00d4aa
    style DB_POSTGRES fill:#336791
```

## Fluxo de Dados - Arquitetura de Informação

```mermaid
graph TB
    subgraph "📥 Entrada de Dados"
        WA[WhatsApp<br/>Mensagens]
        EHR[EHR/FHIR<br/>Sincronização]
        USER[Usuários<br/>Criação Manual]
    end

    subgraph "💾 Camada de Dados"
        P[Patient<br/>Paciente]
        PJ[PatientJourney<br/>Jornada]
        NS[NavigationStep<br/>Etapas]
        CD[CancerDiagnosis<br/>Diagnóstico]
        T[Treatment<br/>Tratamento]
        M[Message<br/>Mensagens]
        O[Observation<br/>Observações FHIR]
    end

    subgraph "🧠 Processamento"
        PS[PriorityScore<br/>Score ML]
        A[Alert<br/>Alertas]
        QR[QuestionnaireResponse<br/>Respostas]
    end

    subgraph "📤 Saída de Dados"
        WS[WebSocket<br/>Notificações]
        API[REST API<br/>Frontend]
        FHIR_OUT[FHIR Server<br/>Sincronização]
    end

    WA -->|Webhook| M
    M -->|Extrai dados| O
    M -->|Analisa sintomas| PS
    M -->|Detecta crítico| A

    EHR -->|FHIR Sync| O
    O -->|Atualiza| P

    USER -->|Cria| P
    P -->|Gera| PJ
    PJ -->|Cria| NS
    P -->|Diagnóstico| CD
    CD -->|Tratamento| T

    NS -->|Atraso| A
    T -->|Atraso| A
    PS -->|Mudança| A

    A -->|Emit| WS
    PS -->|API| API
    O -->|Sync| FHIR_OUT

    style P fill:#4a90e2
    style PS fill:#f5a623
    style A fill:#d0021b
    style M fill:#50e3c2
```

## Legenda dos Diagramas

### Cores e Significados

- 🔵 **Azul** - Frontend (Next.js/React)
- 🔴 **Vermelho** - Backend (NestJS)
- 🟢 **Verde** - AI Service (FastAPI)
- 🔷 **Azul Escuro** - Database (PostgreSQL)
- 🟡 **Amarelo** - Priorização/ML
- 🟠 **Laranja** - Storage (S3)

### Tipos de Setas

- **Seta sólida (→)** - Requisição/Ação
- **Seta tracejada (-→)** - Resposta/Confirmação
- **Seta dupla (↔)** - Comunicação bidirecional

### Níveis Hierárquicos

- **Level 3** - Aplicação principal (alto nível)
- **Level 2** - Sistemas principais (médio nível)
- **Level 1** - Componentes específicos (baixo nível)
- **Level 0** - Serviços externos (infraestrutura)
