# APIs da Plataforma OncoSaaS

> Todas as rotas HTTP do backend utilizam o prefixo global **`/api/v1`** e requerem autenticação via **JWT Bearer** (exceto onde indicado). O token retorna `sub`, `tenantId` e `role`, e os guards (`JwtAuthGuard`, `TenantGuard`, `RolesGuard`) garantem o isolamento multi-tenant + autorização baseada em papéis.

## Convenções Gerais
- **Header**: `Authorization: Bearer <token>` obrigatório em quase todas as rotas.
- **Tenancy**: O `tenantId` é extraído do token; não há query/header manual por padrão.
- **Paginação/ordenação**: endpoints retornam listas pequenas ou aplicam filtros via query strings (ex.: `patientId`, `status`, `journeyStage`).
- **Erros**: seguem padrão Nest (`statusCode`, `message`, `error`). Violações de validação retornam 400 com detalhes por campo.

## Autenticação
| Método | Rota | Descrição | Observações |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Retorna JWT, dados do usuário e tenant atual. | Pública. Espera `email` + `password`. |
| `POST` | `/auth/register` | Cria usuário + tenant inicial. | Pública. Usada apenas em ambiente controlado (sem seleção de tenant ainda). |

## Pacientes (`/patients`)
| Método | Rota | Função | Papéis |
| --- | --- | --- | --- |
| `GET` | `/patients` | Lista pacientes do tenant com prioridade, diagnósticos e status. | Admin, Oncologist, Nurse, Coordinator |
| `GET` | `/patients/by-phone/:phone` | Busca paciente pelo telefone (WhatsApp). | Idem |
| `POST` | `/patients/import` | Upload CSV (`file`) para criar/atualizar pacientes em lote. | Admin, Oncologist, Coordinator |
| `GET` | `/patients/:id/detail` | Retorna ficha completa, diagnósticos e timeline. | Admin, Oncologist, Nurse, Coordinator |
| `GET` | `/patients/:id/cancer-diagnoses` | Lista diagnósticos associados. | Idem |
| `POST` | `/patients/:id/cancer-diagnoses` | Cria novo diagnóstico. | Admin, Oncologist, Coordinator |
| `PATCH` | `/patients/:id/cancer-diagnoses/:diagnosisId` | Atualiza diagnóstico existente. | Admin, Oncologist, Coordinator |
| `POST` | `/patients/:id/priority` | Atualiza prioridade manualmente (ex.: AI). | Admin, Coordinator |
| `POST` | `/patients` | Cria paciente manualmente. | Admin, Oncologist, Coordinator |
| `PATCH` | `/patients/:id` | Atualiza dados cadastrais. | Admin, Oncologist, Coordinator |
| `DELETE` | `/patients/:id` | Remove paciente (soft delete). | Admin |

## Navegação Oncológica (`/oncology-navigation`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/patients/:patientId/steps` | Retorna etapas da jornada para o paciente. |
| `GET` | `/patients/:patientId/steps/:journeyStage` | Filtra etapas por estágio (`SCREENING`, `DIAGNOSIS`, etc.). |
| `POST` | `/patients/:patientId/initialize` | Gera automaticamente etapas para o tipo de câncer informado. |
| `POST` | `/steps` | Cria etapa manual (payload `CreateNavigationStepDto`). |
| `PATCH` | `/steps/:id` | Atualiza etapas (marca como completa, define responsável, etc.). |
| `POST` | `/steps/:id/upload` | Upload de evidências (imagens/PDF até 10 MB). |
| `POST` | `/initialize-all-patients` | Inicializa etapas para todos os pacientes existentes do tenant. |
| `POST` | `/check-overdue` | Roda verificação geral de atrasos e cria alertas. |
| `POST` | `/check-overdue/:patientId` | Roda verificação apenas para um paciente. |
| `POST` | `/patients/:patientId/stages/:journeyStage/create-missing` | Recria etapas faltantes para um estágio específico. |

## Alertas (`/alerts`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/alerts` | Lista alertas (filtráveis por `patientId`, `status`). |
| `GET` | `/alerts/critical` | Lista últimos alertas críticos. |
| `GET` | `/alerts/open/count` | Retorna contagem de alertas em aberto. |
| `GET` | `/alerts/critical/count` | Contagem de alertas críticos. |
| `GET` | `/alerts/:id` | Detalhe completo. |
| `POST` | `/alerts` | Cria alerta manual ou via AI (papéis Admin/Coordinator). |
| `PATCH` | `/alerts/:id` | Atualiza campos gerais (descricao, contexto). |
| `PATCH` | `/alerts/:id/acknowledge` | Marca como assumido por um usuário. |
| `PATCH` | `/alerts/:id/resolve` | Marca como resolvido. |

## Dashboard (`/dashboard`)
| Rota | Descrição |
| --- | --- |
| `GET /dashboard/metrics` | Indicadores gerais (pacientes ativos, atrasos, prioridades). |
| `GET /dashboard/statistics?period=7d|30d|90d` | Séries históricas por período. |
| `GET /dashboard/nurse-metrics` | Produtividade individual da enfermagem (precisa de `user.id`). |
| `GET /dashboard/navigation-metrics` | Distribuição por estágio e tipo de câncer. |
| `GET /dashboard/patients-with-critical-steps` | Lista de pacientes com etapas críticas (filtros `journeyStage`, `cancerType`, `maxResults`). |
| `GET /dashboard/critical-timelines` | Tabela de prazos críticos (ex.: tempo até tratamento). |

## Mensagens (`/messages`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/messages?patientId=UUID` | Lista mensagens (todas ou filtradas por paciente). |
| `GET` | `/messages/unassumed/count` | Contador de conversas não assumidas. |
| `GET` | `/messages/conversation/:patientId?limit=50` | Retorna histórico paginado mais recente. |
| `GET` | `/messages/:id` | Detalhe de uma mensagem específica. |
| `POST` | `/messages` | Cria mensagem manual (system/human). Se `processedBy=NURSING`, preenche `assumedBy`. |
| `PATCH` | `/messages/:id` | Atualiza status/metadados (ex.: marca como enviado). |
| `PATCH` | `/messages/:id/assume` | Marca conversa como assumida pelo usuário atual. |

## Anotações Internas (`/internal-notes`)
- `POST /internal-notes` – cria nota associando ao paciente.
- `GET /internal-notes?patientId=UUID` – lista notas filtradas.
- `GET /internal-notes/:id` – detalhe.
- `PATCH /internal-notes/:id` – edita texto/visibilidade.
- `DELETE /internal-notes/:id` – remove nota.

## Intervenções (`/interventions`)
- `POST /interventions` – registra intervenção realizada pela enfermagem/equipe.
- `GET /interventions/me` – lista intervenções do usuário autenticado.
- `GET /interventions/patient/:patientId` – histórico por paciente.
- `GET /interventions/:id` – detalhe.

## Observações Clínicas (`/observations`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/observations` | Cria observation (ex.: sinais vitais). |
| `GET` | `/observations?patientId&code` | Lista com filtros opcionais. |
| `GET` | `/observations/unsynced` | Observações ainda não sincronizadas no FHIR. |
| `GET` | `/observations/:id` | Detalhe. |
| `PATCH` | `/observations/:id` | Atualiza valores. |
| `PATCH` | `/observations/:id/sync` | Marca observation como sincronizada (salva `fhirResourceId`). |
| `DELETE` | `/observations/:id` | Remove observation. |

## Tratamentos (`/treatments`)
- `POST /treatments` – cria plano terapêutico (roles: Admin, Oncologist, Coordinator).
- `GET /treatments/patient/:patientId` – todos tratamentos do paciente.
- `GET /treatments/diagnosis/:diagnosisId` – tratamentos relacionados ao diagnóstico.
- `GET /treatments/:id` – detalhe.
- `PUT /treatments/:id` – atualiza.
- `DELETE /treatments/:id` – remove (Admin/Oncologist).

## Questionários (`/questionnaire-responses`)
- `POST /questionnaire-responses` – cria resposta (usado por AI / fluxos automatizados).
- `GET /questionnaire-responses?patientId&questionnaireId` – lista filtrada.
- `GET /questionnaire-responses/:id` – detalhe.

## Usuários (`/users`)
- `GET /users` – lista usuários do tenant (Admin, Nurse Chief, Coordinator).
- `GET /users/:id` – detalhe.
- `POST /users` – cria usuário (Admin, Nurse Chief).
- `PATCH /users/:id` – atualiza dados e papéis.
- `DELETE /users/:id` – remove (Admin).

## WhatsApp Connections (`/whatsapp-connections`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/whatsapp-connections` | Lista conexões configuradas no tenant. |
| `GET` | `/whatsapp-connections/:id` | Detalhe da conexão. |
| `POST` | `/whatsapp-connections` | Cria conexão manual (token + número). |
| `POST` | `/whatsapp-connections/oauth/initiate` | Inicia fluxo OAuth Meta (retorna URL). |
| `GET` | `/whatsapp-connections/oauth/callback` | Callback público da Meta (redireciona para frontend). |
| `POST` | `/whatsapp-connections/embedded-signup/process` | Finaliza Embedded Signup usando `code`. |
| `PUT` | `/whatsapp-connections/:id` | Atualiza credenciais/config. |
| `DELETE` | `/whatsapp-connections/:id` | Remove conexão. |
| `POST` | `/whatsapp-connections/:id/test` | Testa envio de mensagem. |
| `POST` | `/whatsapp-connections/:id/set-default` | Define conexão padrão do tenant. |

## Integração FHIR (`/fhir`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/fhir/observations/:id/sync` | Push de observation específica para o EHR. |
| `POST` | `/fhir/observations/sync-all` | Sincroniza até 100 observações pendentes. |
| `POST` | `/fhir/patients/:id/sync` | Push do paciente para o EHR. |
| `POST` | `/fhir/patients/:id/pull` | Pull de observações do EHR para o paciente. |

### Configuração FHIR (`/fhir/config` – apenas Admin)
- `GET /fhir/config` – retorna configuração atual (ou marca como desabilitada).
- `POST /fhir/config` – cria/atualiza config (se já existir, atualiza e limpa cache).
- `PUT /fhir/config` – atualização parcial.

## WebSockets
| Namespace | Eventos Emitidos | Observações |
| --- | --- | --- |
| `/alerts` | `critical_alert`, `new_alert`, `alert_updated`, `open_alerts_count` | Autenticação via JWT no handshake (`auth.token`). Rooms: `tenant:{tenantId}` e `patient:{patientId}:tenant:{tenantId}`. Eventos de subscribe/unsubscribe disponíveis. |
| `/messages` | `new_message`, `message_sent`, `message_updated` | Mesmo padrão de autenticação e rooms. Útil para chat e contadores em tempo real. |

## AI Service (referência rápida)
O serviço de IA roda separado (porta 8001 por padrão) e expõe as rotas documentadas em [`docs/desenvolvimento/ai-service-modulo.md`](./ai-service-modulo.md):
- `POST /api/v1/prioritize`
- `POST /api/v1/agent/message`
- `GET /api/v1/health`

O backend consome essas rotas via `AI_SERVICE_URL` e `BACKEND_SERVICE_TOKEN`, e utiliza os resultados para atualizar prioridades ou gerar alertas.

---
Esses endpoints cobrem a superfície atual da plataforma. Sempre verifique os papéis necessários antes de chamar uma rota e consulte os DTOs nos módulos correspondentes para saber os campos obrigatórios e formatos aceitos.
