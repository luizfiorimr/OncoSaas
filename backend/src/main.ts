import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente ANTES de qualquer importação que use Prisma
// O Prisma Client precisa do DATABASE_URL no momento da inicialização
dotenv.config({ path: resolve(__dirname, '../.env') });

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { existsSync, mkdirSync, readFileSync } from 'fs';

async function bootstrap() {
  // Verificar se deve usar HTTPS
  const useHttps = process.env.USE_HTTPS === 'true';
  // Certificados estão na raiz do projeto
  // Tentar primeiro na raiz, depois subir um nível (se executado de dentro de backend/)
  let certDir = join(process.cwd(), 'certs');
  if (!existsSync(certDir)) {
    certDir = join(process.cwd(), '..', 'certs');
  }
  const keyPath = join(certDir, 'localhost.key');
  const certPath = join(certDir, 'localhost.crt');

  let httpsOptions = undefined;

  if (useHttps) {
    // Verificar se os certificados existem
    if (!existsSync(keyPath) || !existsSync(certPath)) {
      console.error('❌ Certificados SSL não encontrados!');
      console.error(`   Esperado em: ${certDir}`);
      console.error('\n📋 Execute primeiro:');
      console.error('   npm run generate-certs');
      console.error('\n   Ou desative HTTPS:');
      console.error('   USE_HTTPS=false');
      process.exit(1);
    }

    httpsOptions = {
      key: readFileSync(keyPath),
      cert: readFileSync(certPath),
    };
  }

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    httpsOptions ? { httpsOptions } : {},
  );

  // Criar diretório de uploads se não existir
  const uploadsDir = join(process.cwd(), 'uploads', 'navigation-steps');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // CORS - atualizar origin para HTTPS se necessário
  const frontendUrl =
    process.env.FRONTEND_URL ||
    (useHttps ? 'https://localhost:3000' : 'http://localhost:3000');
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prefixo global para APIs
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3002;
  const protocol = useHttps ? 'https' : 'http';
  await app.listen(port);
  console.log(`🚀 Backend running on ${protocol}://localhost:${port}`);
  if (useHttps) {
    console.log(
      '⚠️  Certifique-se de que o certificado está instalado como confiável!',
    );
  }
}

bootstrap();


