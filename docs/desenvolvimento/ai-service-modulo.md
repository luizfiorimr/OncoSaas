# AI Service (FastAPI + ML) – Documentação Técnica

## Visão Geral
O AI Service é um microserviço **FastAPI (Python 3.11)** dedicado às capacidades de inteligência artificial da plataforma. Ele concentra o **modelo de priorização clínica** (ensemble XGBoost/RandomForest/LightGBM) e o **agente conversacional WhatsApp** que interage com pacientes, detecta sintomas críticos e gera alertas para o backend NestJS. O serviço é stateless, expõe apenas 3 rotas REST e depende de chaves de LLM (OpenAI/Anthropic) configuradas via variáveis de ambiente.

## Principais Responsabilidades
- Calcular o **score de prioridade (0-100)** para pacientes com base em estágio, ECOG, sintomas e tempo desde o último contato.
- Expor o endpoint `/agent/message` que orquestra prompts, chama o LLM e retorna resposta estruturada + sintomas críticos sinalizados.
- Realizar health check e expor metadados (`model_trained`) para monitoring.
- Criar alertas no backend via `BackendClient` quando detectar eventos críticos.

## Stack e Dependências
| Categoria | Ferramentas |
| --- | --- |
| Framework web | FastAPI, Uvicorn, CORS Middleware |
| Config | `pydantic-settings` (carrega `.env`) |
| IA Conversacional | openai==1.12.0, anthropic==0.18.1 |
| ML | scikit-learn, xgboost, lightgbm, numpy, pandas |
| Cliente HTTP | httpx (async) |
| Utilidades | sentence-transformers (para embeddings futuros), python-multipart |

## Estrutura
```
ai-service/
├── main.py           # Boot do FastAPI + CORS + router /api/v1
├── src/
│   ├── api/routes.py # Endpoints /prioritize, /agent/message, /health
│   ├── models/
│   │   └── priority_model.py   # Ensemble ML + persistência (joblib)
│   ├── agent/
│   │   └── whatsapp_agent.py   # Estratégia de prompts + detecção de sintomas
│   └── services/
│       └── backend_client.py   # Criação de alertas no backend NestJS
└── requirements.txt  # Lista congelada de pacotes Python
```

## Endpoints Disponíveis (`/api/v1`)
| Método | Rota | Descrição |
| --- | --- | --- |
| `POST` | `/prioritize` | Recebe `PriorityRequest` (câncer, estágio, performance status, sintomas, tempo desde última visita) e retorna `priority_score`, `priority_category` e `reason`. Enquanto o modelo não estiver treinado, aplica regras determinísticas (ex.: dor ≥ 8 adiciona +30 pontos). |
| `POST` | `/agent/message` | Processa mensagens vindas do WhatsApp. O agente gera resposta, lista de sintomas críticos detectados e dados estruturados (ex.: escala de dor). Caso `should_alert` seja verdadeiro, o serviço pode disparar alerts via `BackendClient`. |
| `GET` | `/health` | Retorna status do serviço e se o modelo de priorização está treinado (`model_trained`). |

## Fluxo Conversacional
1. **Prompt do sistema** é gerado dinamicamente com contexto do paciente (tipo de câncer, tratamento atual, etc.).
2. Histórico passado no corpo (`conversation_history`) é reconstituído no formato esperado pelo provedor (OpenAI ou Anthropic).
3. Após a resposta do LLM:
   - `_detect_critical_symptoms` procura palavras-chave (febre, dispneia, sangramento, dor 10/10...).
   - `_extract_structured_data` coleta escala de dor (regex para "dor X/10").
   - O resultado inclui `should_alert` (`True` se houver sintoma crítico) para que o backend decida criar alertas ou fluxos clínicos.

## Integração com Backend
- `BackendClient` utiliza `BACKEND_URL` (default `http://localhost:3002`) e `BACKEND_SERVICE_TOKEN` para criar alertas via `/api/v1/alerts`.
- Métodos auxiliares (`create_critical_symptom_alert`, `create_alert_with_retry`) encapsulam políticas de retry expoencial (2^n) e tratam códigos HTTP comuns.

## Execução e Scripts
```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Para rodar com o Docker Compose do repositório principal, basta garantir que as variáveis estejam no `.env` e subir o backend/infra (Postgres/Redis/RabbitMQ) anteriormente.

## Variáveis de Ambiente Importantes
| Variável | Função |
| --- | --- |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Credenciais do provedor LLM selecionado no `WhatsAppAgent`. |
| `BACKEND_URL` | Base para criação de alertas (`http://localhost:3002`). |
| `BACKEND_SERVICE_TOKEN` | JWT de serviço usado para autenticar chamadas internas ao backend. |
| `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_CREDENTIALS_PATH` | Reservadas para futuros recursos de STT (não usadas diretamente hoje). |
| `AI_SERVICE_URL` | Usada pelo backend para chamar este serviço. |

## Boas Práticas
- Manter `priority_model` treinado e persistido via `joblib` antes de atualizar o serviço em produção para evitar fallback em regras manuais.
- Quando adicionar novo provedor de LLM, estender `WhatsAppAgent` validando chaves no construtor e implementando o wrapper no mesmo padrão.
- Sempre validar payloads com Pydantic (`PriorityRequest`, `AgentMessageRequest`) para evitar chamadas parcialmente preenchidas.
- Habilitar logs estruturados (via `uvicorn --log-level info`) e expor métricas futuras usando o hooks de `lifespan` em `main.py`.

Com esse documento, qualquer pessoa consegue levantar o serviço, entender seus contratos REST e evoluir tanto o modelo de priorização quanto o agente conversacional de forma consistente.
