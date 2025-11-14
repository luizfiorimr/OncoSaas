# Roadmap Visual de Desenvolvimento
## Plataforma de Otimização Oncológica

## Timeline Geral (12 Meses)

```
Mês 1-2: Fundação
├── Infraestrutura
├── Estrutura de Dados
├── Autenticação
└── Integração FHIR Básica

Mês 3-4: Navegação
├── Modelo de Jornada
├── API de Navegação
└── Dashboard de Navegação

Mês 5-6: Priorização IA
├── Modelo ML
├── Serviço de Priorização
└── Visualização de Priorização

Mês 7-9: Agente WhatsApp
├── Integração WhatsApp API
├── Agente Conversacional
├── STT (Áudio)
├── Questionários Adaptativos
├── Detecção de Sintomas
└── Extração de Dados

Mês 10-11: Dashboard Enfermagem
├── API Conversas/Alertas
├── Lista de Pacientes
├── Visualização de Conversas
├── Alertas Tempo Real
├── Intervenção Manual
└── Métricas

Mês 12: Finalização
├── Protocolos (Opcional)
├── Performance
├── Testes
└── Deploy Produção
```

---

## Diagrama de Dependências

```
Fase 1: Fundação
    │
    ├──→ Fase 2: Navegação
    │       │
    │       └──→ Fase 5: Dashboard Enfermagem
    │
    ├──→ Fase 3: Priorização IA
    │       │
    │       └──→ Fase 5: Dashboard Enfermagem
    │
    └──→ Fase 4: Agente WhatsApp
            │
            ├──→ 4.2 Agente Core
            │       │
            │       ├──→ 4.4 Questionários
            │       │
            │       └──→ 4.5 Detecção
            │               │
            │               └──→ Fase 5: Alertas
            │
            └──→ 4.6 Extração
                    │
                    └──→ Fase 5: Conversas
```

---

## Priorização de Features (MVP)

### Must Have (P0) - Crítico para MVP

1. ✅ **Navegação de Pacientes**
   - Dashboard básico
   - Lista de pacientes
   - Filtros básicos

2. ✅ **Priorização com IA**
   - Modelo básico funcionando
   - Score de prioridade
   - Lista ordenada

3. ✅ **Agente WhatsApp**
   - Conversas básicas
   - Coleta de sintomas
   - Detecção de críticos

4. ✅ **Dashboard Enfermagem**
   - Visualização de conversas
   - Alertas em tempo real
   - Intervenção manual

5. ✅ **Integração FHIR**
   - Pull de pacientes
   - Push de observações

### Should Have (P1) - Importante mas não crítico

6. ⚠️ **Questionários Adaptativos**
   - EORTC QLQ-C30
   - PRO-CTCAE básico

7. ⚠️ **STT (Áudio)**
   - Processamento de áudios

8. ⚠️ **Métricas e Analytics**
   - Dashboard básico de métricas

### Nice to Have (P2) - Pode esperar

9. 📋 **Otimização de Protocolos**
   - Sugestões de protocolos
   - Monitoramento de toxicidade

10. 📋 **Integração HL7 v2**
    - Suporte a sistemas legados

---

## Milestones Principais

### Milestone 1: MVP Técnico (Mês 6)
**Data:** 6 meses após início  
**Entregáveis:**
- Navegação funcional
- Priorização básica
- Agente WhatsApp básico
- Dashboard enfermagem básico

**Critérios de Aceitação:**
- ✅ Sistema funcional end-to-end
- ✅ Testes básicos passando
- ✅ Documentação técnica completa

---

### Milestone 2: MVP Completo (Mês 9)
**Data:** 9 meses após início  
**Entregáveis:**
- Todas as features P0 completas
- Questionários adaptativos
- STT funcional
- Métricas básicas

**Critérios de Aceitação:**
- ✅ Todas as features críticas funcionando
- ✅ Testes E2E completos
- ✅ Performance aceitável
- ✅ Pronto para piloto

---

### Milestone 3: Produção (Mês 12)
**Data:** 12 meses após início  
**Entregáveis:**
- Sistema em produção
- Todas as features P0 e P1
- Testes completos
- Documentação completa

**Critérios de Aceitação:**
- ✅ Uptime >99.9%
- ✅ Performance otimizada
- ✅ Segurança validada
- ✅ Pronto para clientes

---

## Recursos Necessários

### Equipe Técnica

**Backend (2-3 desenvolvedores)**
- Node.js/NestJS
- Python/FastAPI
- PostgreSQL
- Integrações (FHIR, WhatsApp)

**Frontend (2 desenvolvedores)**
- Next.js/React
- TypeScript
- Tailwind CSS
- Charts/Visualizações

**IA/ML (1-2 engenheiros)**
- Modelos de ML
- Agente conversacional
- NLP/STT

**DevOps (1 engenheiro)**
- Infraestrutura
- CI/CD
- Monitoramento
- Segurança

**QA (1 testador)**
- Testes manuais
- Testes automatizados
- Validação de features

**Total: 7-9 pessoas**

---

## Orçamento Estimado (12 meses)

### Custos de Desenvolvimento

**Equipe:**
- Backend: R$ 180.000 (2 devs × R$ 15k/mês × 6 meses)
- Frontend: R$ 120.000 (2 devs × R$ 10k/mês × 6 meses)
- IA/ML: R$ 120.000 (1 eng × R$ 20k/mês × 6 meses)
- DevOps: R$ 60.000 (1 eng × R$ 10k/mês × 6 meses)
- QA: R$ 60.000 (1 tester × R$ 10k/mês × 6 meses)

**Subtotal Equipe: R$ 540.000**

### Custos de Infraestrutura

**Cloud (AWS/GCP):**
- Servidores: R$ 3.000/mês × 12 = R$ 36.000
- Banco de dados: R$ 2.000/mês × 12 = R$ 24.000
- Storage: R$ 500/mês × 12 = R$ 6.000
- CDN/Networking: R$ 1.000/mês × 12 = R$ 12.000

**Subtotal Infra: R$ 78.000**

### Custos de APIs Externas

**WhatsApp Business API:**
- Setup: R$ 5.000
- Mensagens: R$ 2.000/mês × 12 = R$ 24.000

**APIs de IA:**
- GPT-4/Claude: R$ 5.000/mês × 12 = R$ 60.000
- STT: R$ 1.000/mês × 12 = R$ 12.000

**Subtotal APIs: R$ 101.000**

### Custos de Ferramentas

**Ferramentas de Desenvolvimento:**
- GitHub/GitLab: R$ 500/mês × 12 = R$ 6.000
- CI/CD: R$ 1.000/mês × 12 = R$ 12.000
- Monitoramento: R$ 1.500/mês × 12 = R$ 18.000
- Design (Figma): R$ 500/mês × 12 = R$ 6.000

**Subtotal Ferramentas: R$ 42.000**

### Total Estimado: R$ 761.000

**Observação:** Valores são estimativas. Custos reais podem variar conforme contratação, região e negociações.

---

## Riscos e Contingências

### Riscos de Prazo

**Risco:** Integração WhatsApp mais complexa que esperado  
**Mitigação:** Buffer de 2 semanas na Fase 4  
**Contingência:** Simplificar features iniciais

**Risco:** Modelo de ML não performa bem  
**Mitigação:** Validação contínua, ajustes iterativos  
**Contingência:** Sistema de regras como fallback

### Riscos Técnicos

**Risco:** Performance com escala  
**Mitigação:** Testes de carga desde cedo, otimização contínua  
**Contingência:** Escalabilidade horizontal

**Risco:** Integração FHIR complexa  
**Mitigação:** Parcerias com integradores, testes extensivos  
**Contingência:** Integração manual via CSV

---

## Próximas Ações

1. **Revisar plano** com equipe técnica e stakeholders
2. **Aprovar orçamento** e alocação de recursos
3. **Contratar equipe** (se necessário)
4. **Setup inicial** (repositório, ferramentas, ambientes)
5. **Kickoff** da Fase 1

---

**FIM DO ROADMAP**

