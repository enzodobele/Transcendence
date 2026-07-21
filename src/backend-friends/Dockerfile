# =========================
# STAGE 1: Build
# =========================
FROM node:22-alpine AS builder

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/

RUN npm install --allow-scripts
RUN npx prisma generate

COPY --chown=nodejs:nodejs . .

# =========================
# STAGE 2: Runtime
# =========================
FROM node:22-alpine

RUN apk add --no-cache wget postgresql-client su-exec

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

RUN mkdir -p /run/secrets && \
    chmod 750 /run/secrets && \
    chown nodejs:nodejs /run/secrets

WORKDIR /app

COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

COPY --chown=nodejs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NPM_CONFIG_CACHE=/tmp/.npm

# No USER here: the entrypoint starts as root to read the secrets mounted
# with 0600 host perms, then drops to 'nodejs' via su-exec.

EXPOSE 3003

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]
