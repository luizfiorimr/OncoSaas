# ==============================================================================
# Backend Dockerfile - NestJS
# ==============================================================================

FROM node:18-alpine AS development

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3002

# Comando de desenvolvimento
CMD ["npm", "run", "start:dev"]

# ==============================================================================
# Build para Produção
# ==============================================================================

FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

RUN npm ci --production && npm cache clean --force

# ==============================================================================
# Imagem de Produção
# ==============================================================================

FROM node:18-alpine AS production

WORKDIR /app

# Copiar apenas o necessário para produção
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 3002

CMD ["node", "dist/main"]
