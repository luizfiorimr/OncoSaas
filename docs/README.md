# 📚 Documentação OncoSaas

Bem-vindo à documentação completa da plataforma OncoSaas - Navegação Oncológica Inteligente.

## 📋 Índice de Documentação

### 🚀 Início Rápido

| Documento | Descrição |
|-----------|-----------|
| [Guia de Instalação](./INSTALLATION.md) | Setup completo do ambiente de desenvolvimento |
| [Quick Start](./QUICKSTART.md) | Primeiros passos após instalação |
| [Estado Atual](./desenvolvimento/estado-atual-proximos-passos.md) | Status do projeto e próximos passos |

### 🏗️ Arquitetura

| Documento | Descrição |
|-----------|-----------|
| [Visão Geral da Arquitetura](./ARCHITECTURE.md) | Arquitetura completa do sistema |
| [Stack Tecnológico](./arquitetura/stack-tecnologico.md) | Tecnologias utilizadas |
| [Estrutura de Dados](./arquitetura/estrutura-dados.md) | Modelo de dados e schema |
| [Atualizações em Tempo Real](./arquitetura/realtime-updates.md) | WebSocket e comunicação real-time |
| [Integração FHIR](./arquitetura/integracao-hl7-fhir.md) | Interoperabilidade com sistemas de saúde |

### 🔌 API

| Documento | Descrição |
|-----------|-----------|
| [Documentação da API](./API.md) | Referência completa da API REST |
| [Autenticação](./API.md#autenticação) | JWT e segurança |
| [Endpoints](./API.md#endpoints) | Lista de todos os endpoints |
| [WebSocket Events](./API.md#websocket) | Eventos em tempo real |

### 💻 Desenvolvimento

| Documento | Descrição |
|-----------|-----------|
| [Setup de Desenvolvimento](./desenvolvimento/setup-desenvolvimento.md) | Configuração do ambiente |
| [Comandos Úteis](./desenvolvimento/comandos-uteis.md) | Scripts e comandos frequentes |
| [Padrões de Código](./DEVELOPMENT.md) | Convenções e boas práticas |
| [Testes](./TESTING.md) | Guia completo de testes |
| [Deploy](./DEPLOYMENT.md) | Guia de implantação |
| [Contribuição](../CONTRIBUTING.md) | Como contribuir |

### 🗄️ Banco de Dados

| Documento | Descrição |
|-----------|-----------|
| [Modelo de Dados](./DATABASE.md) | Schema e entidades |
| [Multi-Tenancy](./DATABASE.md#multi-tenancy) | Isolamento de dados por tenant |
| [Migrations](./DATABASE.md#migrations) | Gerenciamento de schema |

### 🧭 Navegação Oncológica

| Documento | Descrição |
|-----------|-----------|
| [Implementação](./desenvolvimento/navegacao-oncologica-implementacao.md) | Como a navegação funciona |
| [Câncer Colorretal](./desenvolvimento/navegacao-oncologica-colorretal.md) | Protocolo específico |
| [Múltiplos Cânceres](./arquitetura/multiplos-canceres-rastreio.md) | Suporte a múltiplos tipos |

### 🤖 Inteligência Artificial

| Documento | Descrição |
|-----------|-----------|
| [Agente WhatsApp](./arquitetura/agente-whatsapp.md) | Agente conversacional |
| [Modelo de Priorização](./ia-modelo-priorizacao/prototipo-priorizacao.md) | Machine Learning |
| [Resumo de IA](./arquitetura/resumo-implementacao-agente-ia.md) | Visão geral de IA |

### 🚨 Sistema de Alertas

| Documento | Descrição |
|-----------|-----------|
| [Como Funcionam](./sistema-alertas/como-funcionam-alertas.md) | Lógica de alertas |
| [Fluxo de Alertas](./sistema-alertas/fluxo-alertas.md) | Diagrama de fluxo |
| [Quick Reference](./sistema-alertas/QUICK_REFERENCE.md) | Referência rápida |

### 🔒 Segurança e Compliance

| Documento | Descrição |
|-----------|-----------|
| [Segurança](./SECURITY.md) | Práticas de segurança |
| [Checklist Compliance](./compliance-legal/checklist-compliance.md) | LGPD, ANVISA |

### 📊 Produto

| Documento | Descrição |
|-----------|-----------|
| [MVP Features](./mvp-scope/mvp-features.md) | Escopo do MVP |
| [Roadmap](./planejamento/roadmap-visual.md) | Planejamento de desenvolvimento |
| [Pitch Deck](./pitch-deck/pitch-deck-seed-round.md) | Apresentação para investidores |

### 🏥 Materiais de Treinamento

| Documento | Descrição |
|-----------|-----------|
| [Para Enfermeiros](./materiais/enfermeiros/material-enfermeiros.md) | Guia para equipe de enfermagem |
| [Para Oncologistas](./materiais/oncologistas/material-oncologistas.md) | Guia para oncologistas |
| [Guia de Demo](./demo/guia-demo-ao-vivo.md) | Como fazer demonstração |

---

## 🗂️ Estrutura de Pastas

```
docs/
├── README.md                    # Este arquivo (índice principal)
├── ARCHITECTURE.md              # Arquitetura do sistema
├── API.md                       # Documentação da API REST
├── DATABASE.md                  # Modelo de dados e schema
├── DEPLOYMENT.md                # Guia de deploy e implantação
├── DEVELOPMENT.md               # Guia de desenvolvimento
├── INSTALLATION.md              # Guia de instalação
├── QUICKSTART.md                # Início rápido
├── SECURITY.md                  # Segurança e compliance
├── TESTING.md                   # Guia de testes
│
├── arquitetura/                 # Documentação de arquitetura
│   ├── stack-tecnologico.md
│   ├── agente-whatsapp.md
│   ├── realtime-updates.md
│   └── integracao-hl7-fhir.md
├── desenvolvimento/             # Guias de desenvolvimento
│   ├── estado-atual-proximos-passos.md
│   ├── setup-desenvolvimento.md
│   ├── comandos-uteis.md
│   └── navegacao-oncologica-*.md
├── sistema-alertas/             # Sistema de alertas
├── ia-modelo-priorizacao/       # Modelos de IA/ML
├── compliance-legal/            # Compliance e legal (LGPD, ANVISA)
├── mvp-scope/                   # Escopo do MVP
├── planejamento/                # Roadmap e planejamento
├── pitch-deck/                  # Apresentação para investidores
├── product-discovery/           # Pesquisas e discovery
├── materiais/                   # Materiais de treinamento
├── demo/                        # Guias de demonstração
├── banco-dados/                 # Documentação adicional de DB
├── casos-uso/                   # Casos de uso
├── analise-dashboard/           # Análises de UX
└── apresentacao/                # Apresentações
```

---

## 🔗 Links Rápidos

- **README Principal**: [/README.md](../README.md)
- **Repositório GitHub**: [github.com/luizfiorimr/OncoSaas](https://github.com/luizfiorimr/OncoSaas)
- **Credenciais de Teste**: `admin@hospitalteste.com` / `senha123`

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação relevante
2. Verifique os [Issues no GitHub](https://github.com/luizfiorimr/OncoSaas/issues)
3. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: Dezembro 2024
