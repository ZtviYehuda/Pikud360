# ====================================================================
# Production Dockerfile for WhatsApp Gateway Daemon (Baileys)
# ====================================================================
FROM node:20-alpine

# Set non-root user for security
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

COPY . .

# Expose service port
EXPOSE 3001

ENV PORT=3001 \
    NODE_ENV=production

CMD ["node", "server.js"]
