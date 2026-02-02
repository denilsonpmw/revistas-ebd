# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar todo o projeto
COPY . .

# Build do frontend
RUN cd frontend && npm install --legacy-peer-deps && npm run build

# Instalar dependências do backend
RUN cd backend && npm install

# Gerar Prisma Client
RUN cd backend && npx prisma generate

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Instalar OpenSSL (necessário para Prisma)
RUN apk add --no-cache openssl

# Copiar frontend build
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copiar todo o backend (incluindo node_modules e prisma/)
COPY --from=builder /app/backend ./backend

# Definir working directory
WORKDIR /app/backend

# Variáveis de ambiente
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando de start
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/init-admin.js && node src/index.js"]
