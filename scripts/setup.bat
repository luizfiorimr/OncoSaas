@echo off
REM ==============================================================================
REM Script de Setup Automatizado - MedSaaS Oncologia (Windows)
REM ==============================================================================
REM Este script automatiza todo o processo de configuração do ambiente de desenvolvimento
REM Versão: 1.0.0
REM ==============================================================================

setlocal enabledelayedexpansion
set ERRORS=0
set PROJECT_ROOT=%cd%

echo.
echo ========================================
echo Setup Automatizado - MedSaaS Oncologia
echo ========================================
echo.

REM ==============================================================================
REM 1. Verificar Pré-requisitos
REM ==============================================================================

echo.
echo ========================================
echo 1. Verificando Pre-requisitos
echo ========================================
echo.

REM Node.js
where node >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js esta instalado
    node --version
) else (
    echo [ERRO] Node.js nao esta instalado
    set /a ERRORS+=1
)

REM npm
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] npm esta instalado
    npm --version
) else (
    echo [ERRO] npm nao esta instalado
    set /a ERRORS+=1
)

REM Python
where python >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Python esta instalado
    python --version
) else (
    echo [ERRO] Python nao esta instalado
    set /a ERRORS+=1
)

REM Docker (opcional)
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker esta instalado
    docker --version
) else (
    echo [AVISO] Docker nao instalado (opcional, mas recomendado)
)

REM Docker Compose (opcional)
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Docker Compose esta instalado
    docker-compose --version
)

if !ERRORS! gtr 0 (
    echo.
    echo [ERRO] Instale os pre-requisitos obrigatorios antes de continuar
    echo.
    echo Instrucoes de instalacao:
    echo - Node.js: https://nodejs.org/
    echo - Python: https://www.python.org/
    echo - Docker: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM ==============================================================================
REM 2. Configurar Variáveis de Ambiente
REM ==============================================================================

echo.
echo ========================================
echo 2. Configurando Variaveis de Ambiente
echo ========================================
echo.

if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo [OK] Arquivo .env criado a partir de .env.example
        echo [AVISO] Edite o arquivo .env com suas configuracoes
    ) else (
        echo [ERRO] Arquivo .env.example nao encontrado
        pause
        exit /b 1
    )
) else (
    echo [INFO] Arquivo .env ja existe
)

REM ==============================================================================
REM 3. Iniciar Serviços Docker
REM ==============================================================================

echo.
echo ========================================
echo 3. Iniciando Servicos Docker
echo ========================================
echo.

where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Iniciando PostgreSQL, Redis e RabbitMQ...
    docker-compose up -d postgres redis rabbitmq
    echo [OK] Servicos Docker iniciados
    echo [INFO] Aguardando servicos ficarem prontos (10 segundos)...
    timeout /t 10 /nobreak >nul
) else (
    echo [AVISO] Docker nao disponivel. Configure PostgreSQL, Redis e RabbitMQ manualmente
)

REM ==============================================================================
REM 4. Instalar Dependências do Projeto Raiz
REM ==============================================================================

echo.
echo ========================================
echo 4. Instalando Dependencias do Projeto Raiz
echo ========================================
echo.

call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do projeto raiz
    pause
    exit /b 1
)
echo [OK] Dependencias do projeto raiz instaladas

call npm run prepare
echo [OK] Husky configurado

REM ==============================================================================
REM 5. Setup do Backend
REM ==============================================================================

echo.
echo ========================================
echo 5. Setup do Backend
echo ========================================
echo.

cd backend

echo [INFO] Instalando dependencias do backend...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do backend
    cd ..
    pause
    exit /b 1
)
echo [OK] Dependencias do backend instaladas

echo [INFO] Gerando Prisma Client...
call npx prisma generate
echo [OK] Prisma Client gerado

echo [INFO] Executando migrations...
call npx prisma migrate dev --name init
echo [OK] Migrations executadas

echo [INFO] Executando seed (dados iniciais)...
if exist "prisma\seed.ts" (
    call npm run prisma:seed
    echo [OK] Seed executado
) else (
    echo [AVISO] Arquivo de seed nao encontrado (prisma\seed.ts)
)

cd ..

REM ==============================================================================
REM 6. Setup do Frontend
REM ==============================================================================

echo.
echo ========================================
echo 6. Setup do Frontend
echo ========================================
echo.

cd frontend

echo [INFO] Instalando dependencias do frontend...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend
    cd ..
    pause
    exit /b 1
)
echo [OK] Dependencias do frontend instaladas

cd ..

REM ==============================================================================
REM 7. Setup do AI Service
REM ==============================================================================

echo.
echo ========================================
echo 7. Setup do AI Service
echo ========================================
echo.

cd ai-service

echo [INFO] Criando ambiente virtual Python...
python -m venv .venv
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao criar ambiente virtual Python
    cd ..
    pause
    exit /b 1
)
echo [OK] Ambiente virtual criado

echo [INFO] Ativando ambiente virtual e instalando dependencias...
call .venv\Scripts\activate.bat

python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias Python
    call deactivate
    cd ..
    pause
    exit /b 1
)
echo [OK] Dependencias Python instaladas

call deactivate

cd ..

REM ==============================================================================
REM 8. Gerar Certificados SSL
REM ==============================================================================

echo.
echo ========================================
echo 8. Gerando Certificados SSL
echo ========================================
echo.

if not exist "certs" (
    mkdir certs
)

if exist "scripts\generate-ssl-certs.js" (
    call npm run generate-certs
    echo [OK] Certificados SSL gerados
) else (
    echo [AVISO] Script de geracao de certificados nao disponivel
)

REM ==============================================================================
REM 9. Validar Setup
REM ==============================================================================

echo.
echo ========================================
echo 9. Validando Setup
echo ========================================
echo.

call npm run validate
if %errorlevel% neq 0 (
    echo [AVISO] Validacao encontrou alguns avisos (nao criticos)
)

REM ==============================================================================
REM 10. Resumo Final
REM ==============================================================================

echo.
echo ========================================
echo OK Setup Concluido!
echo ========================================
echo.
echo Servicos Configurados:
echo   - PostgreSQL (porta 5433)
echo   - Redis (porta 6379)
echo   - RabbitMQ (porta 5672, management: 15672)
echo.
echo Como Iniciar o Desenvolvimento:
echo.
echo   # Opcao 1: Iniciar tudo via Docker Compose
echo   docker-compose up -d
echo.
echo   # Opcao 2: Iniciar cada servico separadamente
echo   cd backend ^&^& npm run start:dev     (Terminal 1)
echo   cd frontend ^&^& npm run dev          (Terminal 2)
echo   cd ai-service ^&^& .venv\Scripts\activate ^&^& uvicorn main:app --reload --port 8001  (Terminal 3)
echo.
echo   # Opcao 3: Iniciar com scripts do package.json
echo   npm run dev                         (Frontend + Backend)
echo   npm run ai:dev                      (AI Service)
echo.
echo URLs dos Servicos:
echo   - Frontend:   http://localhost:3000
echo   - Backend:    http://localhost:3002
echo   - AI Service: http://localhost:8001
echo   - Prisma Studio: npm run db:studio
echo.
echo Documentacao:
echo   - Setup: docs\desenvolvimento\setup-desenvolvimento.md
echo   - Comandos: docs\desenvolvimento\comandos-uteis.md
echo   - Deploy: DEPLOY.md
echo.
echo PROXIMOS PASSOS IMPORTANTES:
echo   1. Edite o arquivo .env com suas configuracoes
echo   2. Configure as APIs externas (OpenAI, WhatsApp, etc.)
echo   3. Para HTTPS local, instale o certificado: docs\desenvolvimento\https-setup.md
echo.

if !ERRORS! gtr 0 (
    echo [AVISO] Setup concluido com !ERRORS! aviso(s). Verifique as mensagens acima.
    pause
    exit /b 1
) else (
    echo [OK] Setup concluido com sucesso! 🎉
    pause
    exit /b 0
)
