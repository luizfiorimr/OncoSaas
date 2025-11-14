# Arquitetura do Agente de IA no WhatsApp

## Visão Geral

Agente conversacional de IA que coleta dados clínicos de pacientes via WhatsApp, detecta sintomas críticos e alerta a equipe de enfermagem em tempo real.

## Fluxo de Mensagens

```
Paciente envia mensagem (texto/áudio)
    ↓
Webhook WhatsApp recebe
    ↓
Fila de mensagens (RabbitMQ/Redis Queue)
    ↓
Serviço de Agente processa
    ↓
[STT] Se áudio → transcrição
    ↓
[LLM + RAG] Processa mensagem
    ↓
Detecta sintoma crítico?
    SIM → Alerta enfermagem (tempo real)
    NÃO → Continua conversa
    ↓
Extrai dados estruturados
    ↓
Armazena no banco
    ↓
Envia para EHR via FHIR
    ↓
Atualiza score de priorização
    ↓
Enfermagem visualiza no dashboard
```

## Componentes

### 1. Webhook WhatsApp

**Endpoint**: `POST /webhooks/whatsapp`

**Payload**:
```typescript
interface WhatsAppWebhookPayload {
  messages: [{
    from: string; // número do paciente
    id: string; // message ID
    type: 'text' | 'audio' | 'image';
    text?: { body: string };
    audio?: { id: string };
    timestamp: string;
  }];
}
```

**Processamento**:
1. Validar assinatura (segurança)
2. Extrair dados da mensagem
3. Enfileirar para processamento assíncrono
4. Retornar 200 OK imediatamente

### 2. Fila de Mensagens

**Tecnologia**: RabbitMQ ou Redis Queue

**Filas**:
- `whatsapp.inbound`: Mensagens recebidas
- `whatsapp.outbound`: Mensagens a enviar
- `whatsapp.audio`: Áudios para transcrição

**Processamento Assíncrono**:
- Worker processa mensagens da fila
- Rate limiting: respeitar limites do WhatsApp
- Retry: até 3 tentativas se falhar

### 3. Processamento de Áudio (STT)

**Serviço**: Google Cloud Speech-to-Text ou AWS Transcribe

**Fluxo**:
1. Download do áudio do WhatsApp (via API)
2. Upload para bucket S3 (backup)
3. Enviar para STT API
4. Receber transcrição
5. Processar como texto

**Configuração STT**:
- Idioma: Português (pt-BR)
- Modelo: Medical/Healthcare (se disponível)
- Formato: OGG, MP3, WAV

### 4. Agente Conversacional (LLM)

**Modelo Base**: GPT-4 ou Claude (via API)

**Contexto do Agente**:
```typescript
interface AgentContext {
  patientId: string;
  patientName: string;
  cancerType: string;
  currentTreatment?: string;
  conversationHistory: Message[];
  lastInteractionDate?: Date;
  currentQuestionnaire?: 'eortc' | 'proctcae' | 'esas' | 'custom';
}
```

**Sistema de Prompt**:
```
Você é um assistente virtual de saúde que conversa com pacientes oncológicos via WhatsApp.

OBJETIVOS:
1. Coletar informações sobre sintomas e qualidade de vida de forma conversacional
2. Detectar sintomas críticos que necessitam atenção imediata
3. Ser empático, claro e respeitoso

REGRAS:
- Use linguagem simples e acessível
- Faça perguntas uma de cada vez
- Se detectar sintoma crítico, ALERTE IMEDIATAMENTE
- Não faça diagnósticos ou prescrições
- Sempre pergunte sobre febre se paciente mencionar mal-estar

SINTOMAS CRÍTICOS (alertar imediatamente):
- Febre >38°C
- Dispneia severa
- Sangramento ativo
- Dor intensa (8-10/10)
- Náuseas/vômitos persistentes
- Sinais de infecção

HISTÓRICO DO PACIENTE:
[Contexto do paciente]

CONVERSA ATUAL:
[Histórico de mensagens]
```

### 5. RAG (Retrieval Augmented Generation)

**Base de Conhecimento**:
- Guidelines NCCN, ASCO, ESMO
- Questionários validados (EORTC QLQ-C30, PRO-CTCAE, ESAS)
- Informações sobre tipos de câncer
- Protocolos de tratamento

**Implementação**:
1. **Embeddings**: Usar sentence-transformers (português)
2. **Vector DB**: Pinecone ou Weaviate
3. **Retrieval**: Buscar contexto relevante antes de gerar resposta
4. **Injeção**: Injetar contexto no prompt do LLM

**Fluxo RAG**:
```
Pergunta do paciente
    ↓
Gerar embedding da pergunta
    ↓
Buscar no vector DB (top 3-5 documentos)
    ↓
Injetar contexto no prompt
    ↓
LLM gera resposta com contexto
```

### 6. Detecção de Sintomas Críticos

**Lógica de Detecção**:

**Regras Baseadas em Palavras-chave**:
```python
CRITICAL_KEYWORDS = {
    'febre': ['febre', 'febril', 'temperatura alta', 'calafrio'],
    'dispneia': ['falta de ar', 'não consigo respirar', 'sufocando'],
    'sangramento': ['sangrando', 'sangue', 'hemorragia'],
    'dor_intensa': ['dor muito forte', 'dor 10', 'dor insuportável'],
    'vomito': ['vomitando muito', 'não paro de vomitar']
}

def detect_critical_symptom(message: str) -> Optional[str]:
    message_lower = message.lower()
    for symptom, keywords in CRITICAL_KEYWORDS.items():
        if any(keyword in message_lower for keyword in keywords):
            return symptom
    return None
```

**LLM-based Detection**:
- Usar LLM para detectar sintomas críticos de forma mais contextual
- Prompt específico para detecção

**Validação de Severidade**:
- Se detectar sintoma crítico, perguntar intensidade/escala
- Se escala > threshold → alerta

### 7. Extração de Dados Estruturados

**Mapeamento Conversacional → Escalas**:

**EORTC QLQ-C30**:
- Perguntas sobre qualidade de vida
- Escala: 1-4 (não, um pouco, bastante, muito)

**PRO-CTCAE**:
- Sintomas relacionados ao tratamento
- Escala: 0-4 (nenhum, leve, moderado, severo, muito severo)

**ESAS**:
- Escala de sintomas de Edmonton
- Escala: 0-10

**Exemplo de Extração**:
```python
# Mensagem: "Estou com muita dor, tipo 8 de 10"
# Extrai: pain_severity = 8

# Mensagem: "Estou com um pouco de náusea"
# Extrai: nausea_severity = 2 (mapping: "um pouco" → 2)
```

**LLM para Extração**:
- Usar LLM com função estruturada (function calling)
- Prompt para extrair dados estruturados

### 8. Guardrails e Segurança

**Validação de Respostas**:
1. Verificar se resposta é apropriada (não contém informações médicas incorretas)
2. Verificar se não faz diagnóstico/prescrição
3. Verificar se detectou urgência corretamente

**Prevenção de Alucinações**:
- RAG para fornecer contexto baseado em conhecimento médico
- Limit de tokens para respostas
- Validar informações críticas com base de conhecimento

**Rate Limiting**:
- Limitar número de mensagens por paciente (ex: 10/min)
- Limitar número de conversas simultâneas

**Moderação de Conteúdo**:
- Filtrar conteúdo inadequado
- Detectar spam/abuse

### 9. Handoff Manual (Enfermagem Assume)

**Trigger**:
- Enfermagem clica "Assumir Conversa" no dashboard
- Enfermagem responde manualmente

**Fluxo**:
```
Enfermagem recebe alerta
    ↓
Visualiza conversa no dashboard
    ↓
Clica "Assumir Conversa"
    ↓
Sistema muda contexto: Agent → Nursing
    ↓
Enfermagem responde via dashboard
    ↓
Mensagem enviada via WhatsApp API
    ↓
Marca caso como resolvido
    ↓
Volta para agente automático (se necessário)
```

**Implementação**:
- Flag `processed_by` na conversa
- Fila separada para mensagens manuais
- Dashboard com interface de chat integrada

## Integração WhatsApp Business API

### Configuração

**Provider**: Evolution API ou Meta diretamente

**Requisitos**:
1. Conta WhatsApp Business verificada
2. Aprovação de templates de mensagens
3. Webhook configurado
4. API credentials

### Templates de Mensagens (Aprovados)

**Template 1: Início de Conversa**
```
Olá {{1}}, como você está se sentindo hoje? 
Podemos conversar sobre seus sintomas e qualidade de vida.
```

**Template 2: Lembrete**
```
Olá {{1}}, precisamos saber como você está esta semana.
Responda quando puder. 😊
```

**Template 3: Questionário**
```
Olá {{1}}, vamos fazer uma avaliação rápida de seus sintomas.
Responda algumas perguntas quando puder.
```

### Envio de Mensagens

**API Call**:
```typescript
async function sendWhatsAppMessage(
  to: string,
  message: string,
  type: 'text' | 'audio' | 'image'
) {
  const response = await fetch(`${WHATSAPP_API_URL}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: type,
      [type]: {
        text: { body: message },
        // ou audio, image
      }
    })
  });
  
  return response.json();
}
```

### Rate Limiting

**Limites do WhatsApp**:
- 1000 conversas iniciadas por dia (com template)
- Conversas iniciadas pelo paciente: ilimitadas
- Mensagens por segundo: variável

**Implementação**:
- Filas com rate limiting
- Throttling de mensagens
- Monitoramento de limites

## Armazenamento de Conversas

### Estrutura

- **Conversas completas**: Armazenadas no banco de dados
- **Áudios**: Armazenados no S3 (criptografados)
- **Backup**: Backup automático diário

### Criptografia

- **Em trânsito**: TLS 1.3
- **Em repouso**: AES-256 (S3)
- **Banco de dados**: Criptografia de campos sensíveis

## Monitoramento e Analytics

### Métricas

- **Taxa de resposta**: % de pacientes que respondem
- **Tempo médio de resposta**: Tempo até paciente responder
- **Número de conversas**: Por paciente/mês
- **Alertas gerados**: Número de sintomas críticos detectados
- **Handoffs manuais**: Número de vezes que enfermagem assumiu

### Logs

- Todas as mensagens (para auditoria)
- Respostas do LLM (para debug)
- Erros e falhas
- Performance (latência)

## Próximos Passos

1. Implementar webhook básico
2. Integrar com WhatsApp Business API
3. Implementar processamento de áudio (STT)
4. Desenvolver agente conversacional básico
5. Implementar detecção de sintomas críticos
6. Testes com pacientes piloto


