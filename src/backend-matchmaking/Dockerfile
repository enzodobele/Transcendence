# STAGE 1: Build
FROM docker.io/node:22-alpine AS builder

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs prisma ./prisma/

RUN npm ci --allow-scripts
RUN npx prisma generate

COPY --chown=nodejs:nodejs . .

# STAGE 2: Runtime
FROM docker.io/node:22-alpine

RUN apk add --no-cache wget postgresql-client curl jq

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

COPY --chown=nodejs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NPM_CONFIG_CACHE=/tmp/.npm

# Fully non-root: the entrypoint fetches secrets from Vault over HTTP,
# so nothing here ever needs root.
USER nodejs

# Ajustement pour le Matchmaking
EXPOSE 3001

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "run", "dev"]