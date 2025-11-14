"""
Rotas da API do AI Service
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from ..models.priority_model import priority_model
from ..agent.whatsapp_agent import whatsapp_agent

router = APIRouter()


# Models de requisição/resposta
class PriorityRequest(BaseModel):
    cancer_type: str
    stage: str
    performance_status: int
    age: int
    pain_score: Optional[int] = 0
    nausea_score: Optional[int] = 0
    fatigue_score: Optional[int] = 0
    days_since_last_visit: int
    treatment_cycle: Optional[int] = 0


class PriorityResponse(BaseModel):
    priority_score: float
    priority_category: str
    reason: str


class AgentMessageRequest(BaseModel):
    message: str
    patient_id: str
    patient_context: Dict
    conversation_history: List[Dict]


class AgentMessageResponse(BaseModel):
    response: str
    critical_symptoms: List[str]
    structured_data: Dict
    should_alert: bool


@router.post("/prioritize", response_model=PriorityResponse)
async def prioritize_patient(request: PriorityRequest):
    """
    Calcula score de prioridade para um paciente
    """
    try:
        # Preparar features (simulado - em produção, usar feature engineering real)
        import pandas as pd
        
        # Encoding básico (em produção, usar label encoders treinados)
        cancer_type_map = {
            'mama': 0, 
            'pulmao': 1, 
            'colorectal': 2, 
            'prostata': 3,
            'kidney': 4,        # Rim
            'bladder': 5,       # Bexiga
            'testicular': 6,    # Testículo
        }
        stage_map = {'I': 0, 'II': 1, 'III': 2, 'IV': 3}
        
        features = pd.DataFrame([{
            'cancer_type_encoded': cancer_type_map.get(request.cancer_type.lower(), 0),
            'stage_encoded': stage_map.get(request.stage.upper(), 0),
            'performance_status': request.performance_status,
            'age': request.age,
            'pain_score': request.pain_score,
            'nausea_score': request.nausea_score,
            'fatigue_score': request.fatigue_score,
            'days_since_last_visit': request.days_since_last_visit,
            'treatment_cycle': request.treatment_cycle,
        }])
        
        # Predição (modelo ainda não treinado - retornar score baseado em regras)
        if not priority_model.is_trained:
            # Fallback: calcular score baseado em regras simples
            score = 0
            if request.pain_score >= 8:
                score += 30
            if request.stage == 'IV':
                score += 20
            if request.performance_status >= 3:
                score += 25
            if request.days_since_last_visit > 60:
                score += 15
            
            score = min(100, score)
        else:
            # Usar modelo treinado
            predictions = priority_model.predict(features)
            score = float(predictions[0])
        
        category = priority_model.categorize_priority(score)
        
        # Gerar razão (simplificado)
        reasons = []
        if request.pain_score >= 8:
            reasons.append("Dor intensa reportada")
        if request.stage == 'IV':
            reasons.append("Estadiamento avançado")
        if request.performance_status >= 3:
            reasons.append("Performance status comprometido")
        
        reason = "; ".join(reasons) if reasons else "Priorização baseada em múltiplos fatores"
        
        return PriorityResponse(
            priority_score=score,
            priority_category=category,
            reason=reason,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao calcular prioridade: {str(e)}")


@router.post("/agent/message", response_model=AgentMessageResponse)
async def process_agent_message(request: AgentMessageRequest):
    """
    Processa mensagem do paciente via agente de IA
    """
    try:
        result = whatsapp_agent.process_message(
            message=request.message,
            patient_context=request.patient_context,
            conversation_history=request.conversation_history,
        )
        
        return AgentMessageResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar mensagem: {str(e)}")


@router.get("/health")
async def health():
    """Health check"""
    return {
        "status": "ok",
        "service": "ai-service",
        "model_trained": priority_model.is_trained,
    }


