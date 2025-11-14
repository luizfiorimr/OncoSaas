# Como o Agente de IA Deve Criar Alertas

## 📍 Onde Criar o Alerta

**O agente de IA NÃO cria alertas diretamente no banco de dados.**

**Fluxo correto:**
```
Agente de IA (Python) 
    ↓ (HTTP POST)
Backend NestJS (TypeScript)
    ↓ (Prisma)
Banco de Dados PostgreSQL
```

**Por quê?**
- ✅ Validação de negócio (verificar paciente existe, pertence ao tenant)
- ✅ Isolamento de dados (tenantId sempre incluído)
- ✅ WebSocket automático (notificações em tempo real)
- ✅ Auditoria completa (logs, rastreabilidade)
- ✅ Segurança (autenticação/autorização)

---

## 🔌 Endpoint para Criar Alerta

### URL
```
POST http://localhost:3002/api/v1/alerts
```

### Autenticação
**Token JWT obrigatório** no header:
```
Authorization: Bearer {JWT_TOKEN}
```

**⚠️ IMPORTANTE**: O agente precisa de um token de serviço (service token) ou usar um usuário sistema com permissão `ADMIN` ou `COORDINATOR`.

---

## 📋 Payload (Body da Requisição)

### Estrutura do `CreateAlertDto`

```json
{
  "patientId": "uuid-do-paciente",
  "type": "CRITICAL_SYMPTOM",
  "severity": "CRITICAL",
  "message": "Paciente relatou febre alta (39°C) e calafrios",
  "context": {
    "conversationId": "uuid-da-conversa",
    "messageId": "uuid-da-mensagem",
    "symptoms": ["febre", "calafrios"],
    "detectedBy": "ai_agent",
    "confidence": 0.95
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `patientId` | `string` (UUID) | ID do paciente | `"550e8400-e29b-41d4-a716-446655440000"` |
| `type` | `AlertType` (enum) | Tipo do alerta | `"CRITICAL_SYMPTOM"` |
| `severity` | `AlertSeverity` (enum) | Severidade | `"CRITICAL"`, `"HIGH"`, `"MEDIUM"`, `"LOW"` |
| `message` | `string` | Mensagem descritiva | `"Paciente relatou febre alta"` |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `context` | `object` (JSON) | Metadados adicionais | Ver exemplos abaixo |

---

## 📝 Tipos de Alertas (`AlertType`)

```python
# Tipos disponíveis
ALERT_TYPES = {
    "CRITICAL_SYMPTOM": "Sintoma crítico detectado",
    "NO_RESPONSE": "Paciente não respondeu",
    "DELAYED_APPOINTMENT": "Atraso em consulta/exame",
    "SCORE_CHANGE": "Mudança significativa no score",
    "SYMPTOM_WORSENING": "Piora súbita de sintomas",
    "NAVIGATION_DELAY": "Atraso em etapa da navegação",
    "MISSING_EXAM": "Exame necessário não realizado",
    "STAGING_INCOMPLETE": "Estadiamento incompleto",
    "TREATMENT_DELAY": "Atraso no início do tratamento",
    "FOLLOW_UP_OVERDUE": "Seguimento atrasado",
}
```

**Para sintomas críticos detectados pelo agente**: Use `CRITICAL_SYMPTOM`

---

## 🎯 Severidades (`AlertSeverity`)

```python
SEVERITIES = {
    "CRITICAL": "Crítico - requer atenção imediata",
    "HIGH": "Alto - requer atenção urgente",
    "MEDIUM": "Médio - requer atenção em breve",
    "LOW": "Baixo - informativo",
}
```

**Para sintomas críticos**: Use `CRITICAL` ou `HIGH`

---

## 💻 Exemplo de Código Python

### 1. Cliente HTTP para Criar Alerta

```python
# ai-service/src/services/backend_client.py
import httpx
import os
from typing import Dict, Optional

class BackendClient:
    """Cliente HTTP para comunicação com o backend NestJS"""
    
    def __init__(self):
        self.base_url = os.getenv("BACKEND_URL", "http://localhost:3002")
        self.service_token = os.getenv("BACKEND_SERVICE_TOKEN")  # Token de serviço
        
    async def create_alert(
        self,
        patient_id: str,
        alert_type: str,
        severity: str,
        message: str,
        context: Optional[Dict] = None,
        tenant_id: Optional[str] = None,
    ) -> Dict:
        """
        Cria um alerta no backend
        
        Args:
            patient_id: UUID do paciente
            alert_type: Tipo do alerta (ex: "CRITICAL_SYMPTOM")
            severity: Severidade (ex: "CRITICAL", "HIGH", "MEDIUM", "LOW")
            message: Mensagem descritiva do alerta
            context: Metadados adicionais (opcional)
            tenant_id: ID do tenant (se não fornecido, backend usa do token)
            
        Returns:
            Dict com o alerta criado
        """
        url = f"{self.base_url}/api/v1/alerts"
        
        headers = {
            "Authorization": f"Bearer {self.service_token}",
            "Content-Type": "application/json",
        }
        
        # Se tenant_id fornecido, adicionar header (se backend suportar)
        if tenant_id:
            headers["X-Tenant-Id"] = tenant_id
        
        payload = {
            "patientId": patient_id,
            "type": alert_type,
            "severity": severity,
            "message": message,
        }
        
        if context:
            payload["context"] = context
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()  # Levanta exceção se erro HTTP
            return response.json()
    
    async def create_critical_symptom_alert(
        self,
        patient_id: str,
        symptoms: list[str],
        message: str,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
        confidence: float = 1.0,
    ) -> Dict:
        """
        Método helper para criar alerta de sintoma crítico
        
        Args:
            patient_id: UUID do paciente
            symptoms: Lista de sintomas detectados (ex: ["febre", "dispneia"])
            message: Mensagem descritiva
            conversation_id: ID da conversa (opcional)
            message_id: ID da mensagem que gerou o alerta (opcional)
            confidence: Confiança na detecção (0.0 a 1.0)
            
        Returns:
            Dict com o alerta criado
        """
        context = {
            "symptoms": symptoms,
            "detectedBy": "ai_agent",
            "confidence": confidence,
        }
        
        if conversation_id:
            context["conversationId"] = conversation_id
        if message_id:
            context["messageId"] = message_id
        
        return await self.create_alert(
            patient_id=patient_id,
            alert_type="CRITICAL_SYMPTOM",
            severity="CRITICAL",
            message=message,
            context=context,
        )
```

### 2. Integração no Agente WhatsApp

```python
# ai-service/src/agent/whatsapp_agent.py
from .services.backend_client import BackendClient

class WhatsAppAgent:
    def __init__(self):
        self.backend_client = BackendClient()
        # ... resto da inicialização
    
    async def process_message(
        self,
        message: str,
        patient_id: str,
        patient_context: Dict,
        conversation_history: List[Dict],
        conversation_id: Optional[str] = None,
    ) -> Dict:
        """
        Processa mensagem e cria alerta se necessário
        """
        # ... processamento com LLM ...
        
        # Detectar sintomas críticos
        critical_symptoms = self._detect_critical_symptoms(message)
        
        # Se detectou sintomas críticos, criar alerta
        if critical_symptoms:
            try:
                alert_message = self._build_alert_message(
                    critical_symptoms, 
                    patient_context
                )
                
                alert = await self.backend_client.create_critical_symptom_alert(
                    patient_id=patient_id,
                    symptoms=critical_symptoms,
                    message=alert_message,
                    conversation_id=conversation_id,
                    confidence=0.9,  # Alta confiança na detecção
                )
                
                print(f"✅ Alerta criado: {alert['id']}")
                
            except Exception as e:
                print(f"❌ Erro ao criar alerta: {e}")
                # Logar erro mas não interromper fluxo
        
        return {
            "response": agent_response,
            "critical_symptoms": critical_symptoms,
            "structured_data": structured_data,
            "should_alert": len(critical_symptoms) > 0,
        }
    
    def _build_alert_message(
        self, 
        symptoms: list[str], 
        patient_context: Dict
    ) -> str:
        """Constrói mensagem descritiva do alerta"""
        patient_name = patient_context.get("name", "Paciente")
        symptoms_str = ", ".join(symptoms)
        
        return (
            f"Paciente {patient_name} relatou sintomas críticos: {symptoms_str}. "
            f"Requer atenção imediata da equipe de enfermagem."
        )
```

---

## 🔐 Autenticação - Token de Serviço

### Opção 1: Token JWT de Serviço (Recomendado)

**Criar token de serviço no backend:**

```typescript
// backend/src/auth/auth.service.ts
async createServiceToken(tenantId: string): Promise<string> {
  const payload = {
    sub: 'ai-service',
    tenantId,
    roles: ['ADMIN'], // Permissão para criar alertas
    type: 'service', // Tipo: service token
  };
  
  return this.jwtService.sign(payload);
}
```

**Armazenar no `.env` do AI Service:**
```bash
BACKEND_SERVICE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Opção 2: Usuário Sistema (Alternativa)

Criar um usuário sistema no banco:
- Email: `ai-service@medsaas.internal`
- Role: `ADMIN` ou `COORDINATOR`
- Fazer login e usar token JWT retornado

---

## 📊 Exemplos de Context (`context`)

### Exemplo 1: Sintoma Crítico com Conversa

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messageId": "660e8400-e29b-41d4-a716-446655440001",
  "symptoms": ["febre", "calafrios"],
  "detectedBy": "ai_agent",
  "confidence": 0.95,
  "originalMessage": "Estou com muita febre e calafrios",
  "patientMessage": "Estou com muita febre e calafrios"
}
```

### Exemplo 2: Sintoma Crítico com Score

```json
{
  "symptoms": ["dor_intensa"],
  "painScore": 9,
  "detectedBy": "ai_agent",
  "confidence": 0.98,
  "priorityScore": 85,
  "reason": "Dor intensa (9/10) relatada pelo paciente"
}
```

### Exemplo 3: Múltiplos Sintomas

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "symptoms": ["febre", "dispneia", "vomito"],
  "detectedBy": "ai_agent",
  "confidence": 0.92,
  "symptomDetails": {
    "febre": { "temperature": 39.5, "unit": "celsius" },
    "dispneia": { "severity": "severe" },
    "vomito": { "frequency": "persistent" }
  }
}
```

---

## ✅ Validação e Tratamento de Erros

### Códigos HTTP Esperados

- **200 OK**: Alerta criado com sucesso
- **400 Bad Request**: Dados inválidos (campos obrigatórios faltando, valores inválidos)
- **401 Unauthorized**: Token inválido ou expirado
- **403 Forbidden**: Sem permissão (role insuficiente)
- **404 Not Found**: Paciente não encontrado
- **500 Internal Server Error**: Erro no servidor

### Tratamento de Erros no Python

```python
async def create_alert_with_retry(
    self,
    patient_id: str,
    alert_type: str,
    severity: str,
    message: str,
    max_retries: int = 3,
) -> Optional[Dict]:
    """Cria alerta com retry automático"""
    for attempt in range(max_retries):
        try:
            return await self.create_alert(
                patient_id=patient_id,
                alert_type=alert_type,
                severity=severity,
                message=message,
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # Paciente não encontrado - não tentar novamente
                print(f"❌ Paciente {patient_id} não encontrado")
                return None
            elif e.response.status_code == 401:
                # Token inválido - não tentar novamente
                print(f"❌ Token de autenticação inválido")
                return None
            elif e.response.status_code >= 500:
                # Erro do servidor - tentar novamente
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # Backoff exponencial
                    continue
                else:
                    print(f"❌ Erro ao criar alerta após {max_retries} tentativas")
                    return None
            else:
                # Outro erro - não tentar novamente
                print(f"❌ Erro ao criar alerta: {e}")
                return None
        except Exception as e:
            print(f"❌ Erro inesperado: {e}")
            return None
    
    return None
```

---

## 🔄 Fluxo Completo

```
1. Paciente envia mensagem via WhatsApp
   ↓
2. Backend recebe webhook e salva mensagem
   ↓
3. Backend chama AI Service: POST /api/v1/agent/message
   ↓
4. Agente processa mensagem e detecta sintomas críticos
   ↓
5. Agente cria alerta: POST http://localhost:3002/api/v1/alerts
   ↓
6. Backend valida e salva no banco (Prisma)
   ↓
7. Backend emite eventos WebSocket
   ↓
8. Frontend recebe notificação em tempo real
```

---

## 📚 Referências

- **Endpoint**: `POST /api/v1/alerts`
- **Controller**: `backend/src/alerts/alerts.controller.ts`
- **Service**: `backend/src/alerts/alerts.service.ts`
- **DTO**: `backend/src/alerts/dto/create-alert.dto.ts`
- **Schema**: `backend/prisma/schema.prisma` (model `Alert`)

---

## ⚠️ Importante

1. **NUNCA criar alerta diretamente no banco** - sempre usar API do backend
2. **SEMPRE incluir `tenantId`** - backend faz isso automaticamente via token
3. **Validar paciente existe** - backend valida antes de criar
4. **Tratar erros** - implementar retry e logging
5. **Não bloquear fluxo** - se criar alerta falhar, continuar processamento
