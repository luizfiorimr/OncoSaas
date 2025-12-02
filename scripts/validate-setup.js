#!/usr/bin/env node

/**
 * ==============================================================================
 * Script de Validação de Setup - MedSaaS Oncologia
 * ==============================================================================
 * Valida que todas as dependências e configurações estão corretas
 * Versão: 1.0.0
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let errors = 0;
let warnings = 0;

// ==============================================================================
// Funções Auxiliares
// ==============================================================================

function printHeader(text) {
  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.blue + text + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');
}

function printSuccess(text) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

function printError(text) {
  console.log(colors.red + '✗ ' + text + colors.reset);
  errors++;
}

function printWarning(text) {
  console.log(colors.yellow + '⚠ ' + text + colors.reset);
  warnings++;
}

function printInfo(text) {
  console.log(colors.blue + 'ℹ ' + text + colors.reset);
}

function checkCommand(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

function checkDirectory(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

// ==============================================================================
// 1. Verificar Comandos do Sistema
// ==============================================================================

printHeader('1. Verificando Comandos do Sistema');

// Node.js
if (checkCommand('node')) {
  const nodeVersion = execSync('node --version').toString().trim();
  printSuccess(`Node.js instalado: ${nodeVersion}`);
} else {
  printError('Node.js não está instalado');
}

// npm
if (checkCommand('npm')) {
  const npmVersion = execSync('npm --version').toString().trim();
  printSuccess(`npm instalado: ${npmVersion}`);
} else {
  printError('npm não está instalado');
}

// Python
if (checkCommand('python')) {
  const pythonVersion = execSync('python --version').toString().trim();
  printSuccess(`Python instalado: ${pythonVersion}`);
} else if (checkCommand('python3')) {
  const pythonVersion = execSync('python3 --version').toString().trim();
  printSuccess(`Python instalado: ${pythonVersion}`);
} else {
  printError('Python não está instalado');
}

// Git
if (checkCommand('git')) {
  const gitVersion = execSync('git --version').toString().trim();
  printSuccess(`Git instalado: ${gitVersion}`);
} else {
  printWarning('Git não está instalado (recomendado)');
}

// Docker (opcional)
if (checkCommand('docker')) {
  const dockerVersion = execSync('docker --version').toString().trim();
  printSuccess(`Docker instalado: ${dockerVersion}`);
} else {
  printWarning('Docker não está instalado (opcional, mas recomendado)');
}

// ==============================================================================
// 2. Verificar Arquivos de Configuração
// ==============================================================================

printHeader('2. Verificando Arquivos de Configuração');

// .env
if (checkFile('.env')) {
  printSuccess('Arquivo .env existe');
  
  // Verificar variáveis obrigatórias
  const envContent = fs.readFileSync('.env', 'utf-8');
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_API_URL',
  ];
  
  requiredVars.forEach((varName) => {
    if (envContent.includes(`${varName}=`)) {
      const value = envContent.match(new RegExp(`${varName}=(.*)`))?.[1]?.trim();
      if (value && !value.startsWith('your_') && value !== '' && value !== 'change_this') {
        printSuccess(`  ${varName} está configurado`);
      } else {
        printWarning(`  ${varName} precisa ser configurado`);
      }
    } else {
      printError(`  ${varName} não encontrado no .env`);
    }
  });
} else {
  if (checkFile('.env.example')) {
    printError('Arquivo .env não existe. Execute: cp .env.example .env');
  } else {
    printError('Arquivos .env e .env.example não existem');
  }
}

// package.json
if (checkFile('package.json')) {
  printSuccess('package.json existe');
} else {
  printError('package.json não encontrado');
}

// docker-compose.yml
if (checkFile('docker-compose.yml')) {
  printSuccess('docker-compose.yml existe');
} else {
  printWarning('docker-compose.yml não encontrado');
}

// ==============================================================================
// 3. Verificar Estrutura de Diretórios
// ==============================================================================

printHeader('3. Verificando Estrutura de Diretórios');

const directories = [
  'backend',
  'frontend',
  'ai-service',
  'docs',
  'scripts',
  'certs',
];

directories.forEach((dir) => {
  if (checkDirectory(dir)) {
    printSuccess(`Diretório ${dir}/ existe`);
  } else {
    if (dir === 'certs') {
      printWarning(`Diretório ${dir}/ não existe (será criado quando necessário)`);
    } else {
      printError(`Diretório ${dir}/ não encontrado`);
    }
  }
});

// ==============================================================================
// 4. Verificar Dependências do Backend
// ==============================================================================

printHeader('4. Verificando Backend');

if (checkDirectory('backend')) {
  // package.json
  if (checkFile('backend/package.json')) {
    printSuccess('Backend: package.json existe');
  } else {
    printError('Backend: package.json não encontrado');
  }
  
  // node_modules
  if (checkDirectory('backend/node_modules')) {
    printSuccess('Backend: Dependências instaladas (node_modules/)');
  } else {
    printError('Backend: Dependências não instaladas. Execute: cd backend && npm install');
  }
  
  // Prisma
  if (checkFile('backend/prisma/schema.prisma')) {
    printSuccess('Backend: schema.prisma existe');
  } else {
    printError('Backend: schema.prisma não encontrado');
  }
  
  // Prisma Client gerado
  if (checkDirectory('backend/node_modules/.prisma/client')) {
    printSuccess('Backend: Prisma Client gerado');
  } else {
    printWarning('Backend: Prisma Client não gerado. Execute: cd backend && npx prisma generate');
  }
  
  // .eslintrc.json
  if (checkFile('backend/.eslintrc.js')) {
    printSuccess('Backend: ESLint configurado');
  } else {
    printWarning('Backend: ESLint não configurado');
  }
} else {
  printError('Diretório backend/ não encontrado');
}

// ==============================================================================
// 5. Verificar Dependências do Frontend
// ==============================================================================

printHeader('5. Verificando Frontend');

if (checkDirectory('frontend')) {
  // package.json
  if (checkFile('frontend/package.json')) {
    printSuccess('Frontend: package.json existe');
  } else {
    printError('Frontend: package.json não encontrado');
  }
  
  // node_modules
  if (checkDirectory('frontend/node_modules')) {
    printSuccess('Frontend: Dependências instaladas (node_modules/)');
  } else {
    printError('Frontend: Dependências não instaladas. Execute: cd frontend && npm install');
  }
  
  // Next.js config
  if (checkFile('frontend/next.config.js')) {
    printSuccess('Frontend: next.config.js existe');
  } else {
    printWarning('Frontend: next.config.js não encontrado');
  }
  
  // .eslintrc.json
  if (checkFile('frontend/.eslintrc.json')) {
    printSuccess('Frontend: ESLint configurado');
  } else {
    printWarning('Frontend: ESLint não configurado');
  }
} else {
  printError('Diretório frontend/ não encontrado');
}

// ==============================================================================
// 6. Verificar AI Service
// ==============================================================================

printHeader('6. Verificando AI Service');

if (checkDirectory('ai-service')) {
  // requirements.txt
  if (checkFile('ai-service/requirements.txt')) {
    printSuccess('AI Service: requirements.txt existe');
  } else {
    printError('AI Service: requirements.txt não encontrado');
  }
  
  // Virtual environment
  if (checkDirectory('ai-service/.venv') || checkDirectory('ai-service/venv')) {
    printSuccess('AI Service: Ambiente virtual Python existe');
  } else {
    printWarning('AI Service: Ambiente virtual não encontrado. Execute: cd ai-service && python -m venv .venv');
  }
  
  // main.py
  if (checkFile('ai-service/main.py')) {
    printSuccess('AI Service: main.py existe');
  } else {
    printError('AI Service: main.py não encontrado');
  }
} else {
  printError('Diretório ai-service/ não encontrado');
}

// ==============================================================================
// 7. Verificar Ferramentas de Desenvolvimento
// ==============================================================================

printHeader('7. Verificando Ferramentas de Desenvolvimento');

// Husky
if (checkDirectory('.husky')) {
  printSuccess('Husky configurado');
} else {
  printWarning('Husky não configurado. Execute: npm run prepare');
}

// Prettier
if (checkFile('.prettierrc') || checkFile('.prettierrc.json') || checkFile('.prettierrc.js')) {
  printSuccess('Prettier configurado');
} else {
  printWarning('Prettier não configurado');
}

// ==============================================================================
// 8. Verificar Serviços Docker
// ==============================================================================

printHeader('8. Verificando Serviços Docker');

if (checkCommand('docker')) {
  try {
    const psOutput = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf-8' });
    const runningContainers = psOutput.split('\n').filter(Boolean);
    
    ['postgres', 'redis', 'rabbitmq'].forEach((service) => {
      const isRunning = runningContainers.some((container) => container.includes(service));
      if (isRunning) {
        printSuccess(`Serviço ${service} está rodando`);
      } else {
        printWarning(`Serviço ${service} não está rodando. Execute: docker-compose up -d ${service}`);
      }
    });
  } catch (err) {
    printWarning('Não foi possível verificar serviços Docker (Docker pode não estar rodando)');
  }
} else {
  printInfo('Docker não disponível - pulando verificação de serviços');
}

// ==============================================================================
// 9. Resumo Final
// ==============================================================================

printHeader('✅ Resumo da Validação');

console.log(`Total de verificações: ${errors + warnings} problema(s) encontrado(s)`);
console.log(`  - Erros críticos: ${colors.red}${errors}${colors.reset}`);
console.log(`  - Avisos: ${colors.yellow}${warnings}${colors.reset}`);
console.log('');

if (errors > 0) {
  printError('Corrija os erros críticos antes de continuar');
  console.log('');
  console.log('Para instalar dependências faltantes, execute:');
  console.log('  npm run setup  (Linux/Mac)');
  console.log('  scripts\\setup.bat  (Windows)');
  console.log('');
  process.exit(1);
} else if (warnings > 0) {
  printWarning('Alguns avisos foram encontrados, mas não são críticos');
  console.log('');
  printSuccess('Setup está funcional! 🎉');
  console.log('');
  process.exit(0);
} else {
  printSuccess('Todos os testes passaram! Setup completo! 🎉');
  console.log('');
  printInfo('Para iniciar o desenvolvimento:');
  console.log('  npm run dev');
  console.log('');
  process.exit(0);
}
