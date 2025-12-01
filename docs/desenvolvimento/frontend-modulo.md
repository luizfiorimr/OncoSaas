# Frontend (Next.js 14) – Documentação Técnica

## Visão Geral
O frontend é uma aplicação **Next.js 14 (App Router)** escrita em **React + TypeScript** que entrega toda a experiência web multi-tenant para equipes oncológicas. Ele concentra dashboards clínicos, formulários ricos, telas de navegação oncológica e o console de conversas com pacientes. O projeto utiliza **Tailwind CSS + shadcn/ui** para a camada visual, **React Query** para cache de dados do servidor e **Zustand** para estados globais leves (como autenticação). A comunicação em tempo real acontece via **Socket.IO** para badge de alertas críticos e mensagens do WhatsApp.

## Principais Responsabilidades
- Autenticação via NextAuth + armazenamento de sessão no `auth-store`.
- Dashboards com métricas de pacientes, enfermeiros e navegação (`/dashboard`).
- Gestão completa de pacientes (`/patients` e `/patients/[id]`).
- Tela de navegação oncológica com atualização de etapas e upload de evidências (`/oncology-navigation`).
- Console de mensagens e agente WhatsApp (`/chat`).
- Configuração de integrações (WhatsApp, FHIR) e calculadora de ROI.
- Consumo consolidado das APIs do backend e do serviço de IA.
- Recepção de eventos em tempo real (namespaces `/alerts` e `/messages`).

## Stack e Dependências-Chave
| Categoria | Ferramentas |
| --- | --- |
| Framework | Next.js 14 (App Router) + React 18 |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| Estado | React Query 5, Zustand, React Hook Form + Zod |
| Comunicação | Axios, Socket.IO Client, NextAuth |
| Visualização | Recharts, date-fns |

## Estrutura de Pastas Essencial
```
frontend/src/
├── app/                # Rotas App Router (pages + layouts)
│   ├── (auth)/login    # Fluxo de login
│   ├── dashboard/*     # Dashboards (padrão e específico do oncologista)
│   ├── patients/*      # Listagem, detalhe e edição
│   ├── chat            # Console de mensagens em tempo real
│   ├── oncology-navigation # Jornada dos pacientes
│   ├── integrations    # Conexões (WhatsApp, FHIR)
│   ├── calculadora-roi # Página de ROI
│   ├── providers.tsx   # React Query + tema + Toaster
│   └── layout.tsx      # Shell global (Navbar, Sidebar)
├── components/         # Biblioteca de componentes (ui, shared, dashboard)
├── hooks/              # Hooks especializados (pacientes, alerts, sockets...)
├── lib/
│   ├── api/            # Clientes HTTP tipados por recurso
│   ├── utils/          # Helpers (filtros, ordenação)
│   └── validations/    # Schemas Zod compartilhados
├── stores/             # Zustand (ex: auth-store)
├── middleware.ts       # NextAuth / proteção server-side
└── server.js           # Dev server HTTPS opcional para embedded signup
```

## Fluxos e Integrações
- **HTTP**: todos os clientes estão centralizados em `src/lib/api/*.ts` e compartilham o `apiClient` (axios) que injeta o token do NextAuth.
- **Sockets**: `useSocket` cria a conexão genérica e `useAlertsSocket`, `useMessagesSocket` gerenciam eventos dos namespaces `/alerts` e `/messages`.
- **Upload CSV**: hook `usePatientImport` converte arquivos para `FormData` e chama `POST /patients/import`.
- **Oncology Navigation**: hooks `useOncologyNavigation` e `useNavigationMetrics` consomem endpoints de etapas e dashboards, além de anexar evidências com `FileInterceptor` no backend.
- **Chat**: `useMessages` sincroniza histórico via REST e escuta `message_sent/new_message` via Socket.IO; também sinaliza quando a enfermagem assume uma conversa.
- **IA**: telas podem disparar requisições para o backend, que por sua vez conversa com o AI Service. Resultados são renderizados em componentes como `PriorityBadge` e `CriticalAlertBadge`.

## Scripts e Comandos
| Script | Descrição |
| --- | --- |
| `npm run dev` | Dev server padrão (`http://localhost:3000`). |
| `npm run dev:https` | Usa `server.js` para subir Next com certificado local (requerido para OAuth embedded). |
| `npm run build` / `npm start` | Build e execução em modo produção. |
| `npm run lint` / `lint:fix` | ESLint (config `eslint-config-next`). |
| `npm run type-check` | `tsc --noEmit`. |
| `npm run format` / `format:check` | Prettier em TS/TSX/JSON/MD. |

## Variáveis de Ambiente Relevantes
| Variável | Função |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base das requisições REST (ex: `http://localhost:3002`). |
| `NEXT_PUBLIC_WS_URL` | Base do Socket.IO (ex: `ws://localhost:3002`). |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Se NextAuth estiver habilitado. |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` | Útil apenas no `dev:https` com certificados self-signed. |

## Qualidade e Boas Práticas
- ESLint + Prettier aplicados via Husky/lint-staged no commit.
- `tsconfig.json` com paths e strict mode habilitados.
- Layouts são majoritariamente **Server Components**; marcar com `'use client'` apenas quando o hook React precisar.
- Componentes shadcn/ui importados via `@/components/ui/*` para manter consistência.
- Hooks compartilham loaders, states de erro e toasts (`sonner`).
- Seletores de Zustand limitam re-render com `useAuthStore((state) => state.user)`.

## Observabilidade e Realtime
- Badges e banners utilizam os eventos `critical_alert`, `new_alert`, `open_alerts_count` e `new_message` emitidos pelo backend.
- `useDashboardSocket` agrupa assinaturas em dashboards; sempre lembrar de limpar listeners no `useEffect` return.

## Referências Cruzadas
- Setup detalhado: [`docs/desenvolvimento/frontend-setup.md`](./frontend-setup.md)
- Comandos úteis gerais: [`docs/desenvolvimento/comandos-uteis.md`](./comandos-uteis.md)
- Regras de estilo: `.cursor/rules/frontend-padroes.mdc`

Com essa visão, novas features devem seguir o padrão de **hook + componente + cliente HTTP** e reaproveitar stores/utilidades existentes. Para fluxos assíncronos, sempre definir loaders e tratar toasts, mantendo a experiência das equipes clínicas estável.
