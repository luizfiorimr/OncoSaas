# Backend (NestJS) – Documentação Técnica

## Visão Geral
O backend é um **monólito modular NestJS (Node.js + TypeScript)** responsável por toda a lógica de negócio, persistência e integrações externas. Ele segue os padrões de **módulos independentes**, usa **Prisma** para acessar o PostgreSQL multi-tenant e expõe tanto **REST APIs** quanto **Socket.IO gateways** para alertas e mensagens. Além disso, orquestra integrações com **FHIR/HL7**, Meta WhatsApp Business API e o serviço de IA.

## Principais Responsabilidades
- Autenticação JWT + controle por papéis, com `TenantGuard` garantindo isolamento por tenant.
- CRUD completo de pacientes, tratamentos, intervenções, observações clínicas e anotações internas.
- Motor de navegação oncológica (etapas, alertas de atraso, uploads de evidências, scheduler).
- Sistema de alertas e notificações em tempo real (REST + WebSocket + integração com AI Service).
- Console de mensagens com status de atendimento e contadores de conversas não assumidas.
- Dashboards consolidados para enfermeiros, oncologistas e coordenação.
- Integração FHIR bidirecional (configuração + sincronização de pacientes/observações).
- Conectores com WhatsApp Business (OAuth, embedded signup, testes) e pipelines HL7.

## Stack e Dependências-Chave
| Categoria | Ferramentas |
| --- | --- |
| Framework | NestJS 10, @nestjs/config, @nestjs/schedule |
| ORM | Prisma 5 + PostgreSQL 15 |
| Auth | JWT (`@nestjs/jwt`), Passport local/jwt |
| Mensageria/Realtime | Socket.IO (`@nestjs/websockets`), Redis (cache opcional) |
| Integrações | Facebook Business SDK, csv-parser, axios |
| Qualidade | ESLint, Prettier, Jest (unit/e2e) |

## Estrutura Modular (resumo)
| Módulo | Responsabilidade Principal |
| --- | --- |
| `auth` | Login/Register, guards (`JwtAuthGuard`, `TenantGuard`, `RolesGuard`), decorators e strategies. |
| `patients` | CRUD completo, importação CSV, histórico oncológico, alteração de prioridade. |
| `oncology-navigation` | Geração e atualização das etapas da jornada, upload de arquivos, verificações de atraso, scheduler (`oncology-navigation.scheduler.ts`). |
| `alerts` + `gateways/alerts.gateway.ts` | CRUD de alertas, contadores, ACK/resolve e emissão de eventos em `/alerts`. |
| `messages` + `gateways/messages.gateway.ts` | Conversas WhatsApp, contagem de não assumidos, emissão de `new_message`/`message_sent`. |
| `dashboard` | Métricas gerais, enfermeiras, navegação e timelines críticas. |
| `internal-notes` | Anotações internas por paciente (auditadas por usuário). |
| `interventions` | Registro e busca de intervenções por usuário ou paciente. |
| `observations` | Observações clínicas + marcação de sincronismo FHIR. |
| `treatments` | Plano terapêutico por paciente/diagnóstico. |
| `questionnaire-responses` | Persistência das respostas vindas do agente/WhatsApp. |
| `users` | Gestão de usuários por tenant. |
| `whatsapp-connections` | Configuração manual, OAuth, embedded signup, testes e definição de conexão padrão. |
| `integrations/fhir` | Configuração (CRUD) + rotas de sincronismo (push/pull) com EHRs compatíveis com HL7 FHIR. |
| `gateways/*` | Namespaces Socket.IO (`/alerts`, `/messages`) com autenticação JWT no handshake e rooms por tenant/paciente. |
| `config/database.config.ts` & `prisma/*` | Configuração central de banco + service com middlewares multi-tenant. |

## Fluxos Importantes
- **Autenticação**: `POST /auth/login` emite JWT contendo `tenantId` e `role`. Todos os controllers usam `@UseGuards(JwtAuthGuard, TenantGuard[, RolesGuard])` para validar token e restringir papéis.
- **Multi-tenancy**: Cada service recebe o `tenantId` do usuário atual e aplica em todas as consultas Prisma (`where: { tenantId }`). Alerts/mensagens também segmentam rooms por tenant (`tenant:${tenantId}`).
- **Oncology Navigation**: `initializeNavigationSteps`, `checkOverdueSteps` e `createMissingStepsForStage` geram alertas e atualizam metadata; `FileInterceptor` permite anexar arquivos até 10 MB.
- **AI Service**: integrações usam `AI_SERVICE_URL` e tokens de serviço para criar alertas com `backend_client` quando o agente detecta sintomas críticos.
- **FHIR**: configurações ficam na tabela `fHIRIntegrationConfig`; endpoints `/fhir/*` validam se a integração está habilitada antes de sincronizar pacientes/observações.
- **WebSockets**: Namespaces `/alerts` e `/messages` exigem `auth.token` no handshake. Eventos emitidos: `critical_alert`, `new_alert`, `alert_updated`, `open_alerts_count`, `new_message`, `message_sent`, `message_updated`.

## Scripts e Comandos
| Script | Descrição |
| --- | --- |
| `npm run start:dev` | Nest em modo watch (porta padrão 3002). |
| `npm run start:dev:https` | Sobrescreve `USE_HTTPS=true` para testes locais com certificados. |
| `npm run build` / `npm run start:prod` | Compilação para `dist/` e execução. |
| `npm run lint` / `lint:check` | ESLint com regras para `src`, `apps`, `libs`, `test`. |
| `npm run test` / `test:cov` / `test:e2e` | Jest unitário, cobertura e testes end-to-end. |
| `npm run prisma:generate | migrate | seed | studio` | Utilitários Prisma. |

## Variáveis de Ambiente Essenciais
| Variável | Uso |
| --- | --- |
| `PORT` | Porta HTTP (default 3002). |
| `DATABASE_URL` | PostgreSQL (multi-tenant). |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Assinatura e expiração dos tokens. |
| `REDIS_URL`, `RABBITMQ_URL` | Serviços auxiliares (cache, filas) onde aplicável. |
| `AI_SERVICE_URL`, `BACKEND_SERVICE_TOKEN` | Comunicação com AI Service e tokens internos. |
| `META_*`, `WHATSAPP_*`, `ENCRYPTION_KEY` | Integrações WhatsApp OAuth/manual. |
| `FHIR_*` | Defaults para integração FHIR.

## Qualidade e Segurança
- Husky + lint-staged garantem lint/format em TypeScript e Markdown.
- Testes via Jest (padrão Nest) com configuração central no `package.json`.
- Controllers retornam DTOs e os pipes globais validam payloads (`class-validator`).
- Guards obrigatórios protegem todos os endpoints sensíveis; apenas rotas como `/auth/login` e `whatsapp-connections/oauth/callback` usam `@Public()`.
- Encriptação: tokens OAuth do WhatsApp usam `ENCRYPTION_KEY` (AES) centralizado em `whatsapp-connections/utils/encryption.util.ts`.

## Dependências Externas / Infra
- **PostgreSQL**, **Redis** e **RabbitMQ** possuem serviços pré-configurados em `docker-compose.yml` (portas 5433, 6379, 5672/15672) e health checks automáticos.
- Uploads ficam em `./uploads/navigation-steps` (configurável via env + reverse proxy para servir `GET /uploads`).
- A integração com FHIR depende de credenciais por tenant armazenadas na base.

## Referências Cruzadas
- API detalhada: [`docs/desenvolvimento/backend-api.md`](./backend-api.md)
- Regras de desenvolvimento backend: `.cursor/rules/backend-padroes.mdc`
- Setup completo / troubleshooting: [`docs/desenvolvimento/setup-desenvolvimento.md`](./setup-desenvolvimento.md)

Essa visão permite evoluir novos módulos mantendo o padrão NestJS (controller → service → DTOs), reaproveitando guards multi-tenant e garantindo que todo endpoint esteja documentado e coberto por testes/lint.
