FROM node:22-slim

WORKDIR /app

# Instala dependências primeiro (cache de camadas)
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copia o código da aplicação
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/backend

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/barberpro.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/server.js"]
