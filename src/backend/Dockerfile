# =========================
# STAGE 1: Build
# =========================
FROM node:18-alpine AS builder

# Crée un utilisateur avec ton UID/GID local
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copie des fichiers de dépendances
COPY --chown=nodejs:nodejs package*.json ./
RUN npm install

# Copie du reste du code
COPY --chown=nodejs:nodejs . .

# Génère le client Prisma
RUN npm run db:generate

# =========================
# STAGE 2: Runtime
# =========================
FROM node:18-alpine

# Crée le même utilisateur
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copie des dépendances et du code
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

# Installe Prisma globalement
RUN npm install -g prisma

# Copie du script d'entrée
COPY --chown=nodejs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NPM_CONFIG_CACHE=/tmp/.npm

EXPOSE 3000

# Passe à l'utilisateur non-root
USER nodejs

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "src/app.js"]