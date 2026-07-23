# =========================
# STAGE 1: Build
# =========================
FROM node:22-alpine AS builder

# Crée un utilisateur avec UID/GID 1001 (pour éviter les problèmes de permissions)
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copie des fichiers de dépendances
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/

# Installe les dépendances (avec --allow-scripts pour Prisma et Bcrypt)
RUN npm ci --allow-scripts

# Génère le client Prisma
RUN npx prisma generate

# Copie du reste du code
COPY --chown=nodejs:nodejs . .

# =========================
# STAGE 2: Runtime
# =========================
FROM node:22-alpine

# Installe les dépendances nécessaires
RUN apk add --no-cache wget postgresql-client curl jq

# Crée le groupe et l'utilisateur nodejs (UID 1001)
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

# Copie des dépendances et du code depuis le builder
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

# Copie du script d'entrée
COPY --chown=nodejs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Dossier persistant pour les avatars uploadés (monté en volume au runtime)
RUN mkdir -p /app/uploads/avatars && chown -R nodejs:nodejs /app/uploads

ENV NPM_CONFIG_CACHE=/tmp/.npm

# Fully non-root: the entrypoint fetches secrets from Vault over HTTP,
# so nothing here ever needs root.
USER nodejs

# Port d'écoute pour l'Auth
EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]