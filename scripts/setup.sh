#!/bin/bash

# ==============================================================================
# Script de Setup Automatizado - MedSaaS Oncologia
# ==============================================================================
# Este script automatiza todo o processo de configuração do ambiente de desenvolvimento
# Versão: 1.0.0
# ==============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_ROOT=$(pwd)
ERRORS=0

# ==============================================================================
# Funções Auxiliares
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v $1 &> /dev/null; then
        print_success "$1 está instalado"
        return 0
    else
        print_error "$1 não está instalado"
        return 1
    fi
}

# ==============================================================================
# 1. Verificar Pré-requisitos
# ==============================================================================

print_header "1. Verificando Pré-requisitos"

# Node.js
if check_command node; then
    NODE_VERSION=$(node --version)
    print_info "Versão: $NODE_VERSION"
fi

# npm
if check_command npm; then
    NPM_VERSION=$(npm --version)
    print_info "Versão: $NPM_VERSION"
fi

# Python
if check_command python3; then
    PYTHON_VERSION=$(python3 --version)
    print_info "Versão: $PYTHON_VERSION"
else
    # Tentar python sem o 3
    if check_command python; then
        PYTHON_VERSION=$(python --version)
        print_info "Versão: $PYTHON_VERSION"
    fi
fi

# Docker (opcional)
if check_command docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_info "Versão: $DOCKER_VERSION"
else
    print_warning "Docker não instalado (opcional, mas recomendado)"
fi

# Docker Compose (opcional)
if check_command docker-compose; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    print_info "Versão: $COMPOSE_VERSION"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    print_error "Instale os pré-requisitos obrigatórios antes de continuar"
    echo ""
    echo "Instruções de instalação:"
    echo "- Node.js: https://nodejs.org/"
    echo "- Python: https://www.python.org/"
    echo "- Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# ==============================================================================
# 2. Configurar Variáveis de Ambiente
# ==============================================================================

print_header "2. Configurando Variáveis de Ambiente"

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_success "Arquivo .env criado a partir de .env.example"
        print_warning "ATENÇÃO: Edite o arquivo .env com suas configurações"
        print_info "Execute: nano .env  ou  code .env"
    else
        print_error "Arquivo .env.example não encontrado"
        exit 1
    fi
else
    print_info "Arquivo .env já existe"
fi

# ==============================================================================
# 3. Iniciar Serviços Docker (se Docker disponível)
# ==============================================================================

print_header "3. Iniciando Serviços Docker"

if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
    print_info "Iniciando PostgreSQL, Redis e RabbitMQ..."
    
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres redis rabbitmq
    else
        docker compose up -d postgres redis rabbitmq
    fi
    
    print_success "Serviços Docker iniciados"
    print_info "Aguardando serviços ficarem prontos (10 segundos)..."
    sleep 10
else
    print_warning "Docker não disponível. Configure PostgreSQL, Redis e RabbitMQ manualmente"
fi

# ==============================================================================
# 4. Instalar Dependências do Projeto Raiz
# ==============================================================================

print_header "4. Instalando Dependências do Projeto Raiz"

npm install
print_success "Dependências do projeto raiz instaladas"

# Configurar Husky
npm run prepare
print_success "Husky configurado"

# ==============================================================================
# 5. Setup do Backend
# ==============================================================================

print_header "5. Setup do Backend"

cd backend

print_info "Instalando dependências do backend..."
npm install
print_success "Dependências do backend instaladas"

print_info "Gerando Prisma Client..."
npx prisma generate
print_success "Prisma Client gerado"

print_info "Executando migrations..."
npx prisma migrate dev --name init
print_success "Migrations executadas"

print_info "Executando seed (dados iniciais)..."
if [ -f "prisma/seed.ts" ]; then
    npm run prisma:seed
    print_success "Seed executado"
else
    print_warning "Arquivo de seed não encontrado (prisma/seed.ts)"
fi

cd ..

# ==============================================================================
# 6. Setup do Frontend
# ==============================================================================

print_header "6. Setup do Frontend"

cd frontend

print_info "Instalando dependências do frontend..."
npm install
print_success "Dependências do frontend instaladas"

cd ..

# ==============================================================================
# 7. Setup do AI Service
# ==============================================================================

print_header "7. Setup do AI Service"

cd ai-service

# Verificar se Python está disponível
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    print_error "Python não encontrado"
    cd ..
    exit 1
fi

print_info "Criando ambiente virtual Python..."
$PYTHON_CMD -m venv .venv
print_success "Ambiente virtual criado"

print_info "Ativando ambiente virtual e instalando dependências..."
source .venv/bin/activate 2>/dev/null || .venv\\Scripts\\activate 2>/dev/null

pip install --upgrade pip
pip install -r requirements.txt
print_success "Dependências Python instaladas"

deactivate 2>/dev/null || true

cd ..

# ==============================================================================
# 8. Gerar Certificados SSL (para HTTPS local)
# ==============================================================================

print_header "8. Gerando Certificados SSL"

if [ ! -d "certs" ]; then
    mkdir certs
fi

if command -v node &> /dev/null && [ -f "scripts/generate-ssl-certs.js" ]; then
    npm run generate-certs
    print_success "Certificados SSL gerados"
else
    print_warning "Script de geração de certificados não disponível"
fi

# ==============================================================================
# 9. Validar Setup
# ==============================================================================

print_header "9. Validando Setup"

npm run validate || print_warning "Validação encontrou alguns avisos (não críticos)"

# ==============================================================================
# 10. Resumo Final
# ==============================================================================

print_header "✅ Setup Concluído!"

echo ""
echo "📦 Serviços Configurados:"
echo "  - PostgreSQL (porta 5433)"
echo "  - Redis (porta 6379)"
echo "  - RabbitMQ (porta 5672, management: 15672)"
echo ""
echo "🚀 Como Iniciar o Desenvolvimento:"
echo ""
echo "  # Opção 1: Iniciar tudo via Docker Compose"
echo "  docker-compose up -d"
echo ""
echo "  # Opção 2: Iniciar cada serviço separadamente"
echo "  cd backend && npm run start:dev     # Terminal 1"
echo "  cd frontend && npm run dev          # Terminal 2"
echo "  cd ai-service && source .venv/bin/activate && uvicorn main:app --reload --port 8001  # Terminal 3"
echo ""
echo "  # Opção 3: Iniciar com scripts do package.json"
echo "  npm run dev                         # Frontend + Backend"
echo "  npm run ai:dev                      # AI Service"
echo ""
echo "🔗 URLs dos Serviços:"
echo "  - Frontend:   http://localhost:3000"
echo "  - Backend:    http://localhost:3002"
echo "  - AI Service: http://localhost:8001"
echo "  - Prisma Studio: npm run db:studio"
echo ""
echo "📚 Documentação:"
echo "  - Setup: docs/desenvolvimento/setup-desenvolvimento.md"
echo "  - Comandos: docs/desenvolvimento/comandos-uteis.md"
echo "  - Deploy: DEPLOY.md"
echo ""
echo "⚠️  PRÓXIMOS PASSOS IMPORTANTES:"
echo "  1. Edite o arquivo .env com suas configurações"
echo "  2. Configure as APIs externas (OpenAI, WhatsApp, etc.)"
echo "  3. Para HTTPS local, instale o certificado: docs/desenvolvimento/https-setup.md"
echo ""

if [ $ERRORS -gt 0 ]; then
    print_warning "Setup concluído com $ERRORS aviso(s). Verifique as mensagens acima."
    exit 1
else
    print_success "Setup concluído com sucesso! 🎉"
    exit 0
fi
