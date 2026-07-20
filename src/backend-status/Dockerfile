# =========================
# STAGE 1: Build
# =========================
FROM node:22-alpine AS builder

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci

COPY --chown=nodejs:nodejs . .

# =========================
# STAGE 2: Runtime
# =========================
FROM node:22-alpine

# postgresql-client pour pg_dump (backup)
RUN apk add --no-cache wget postgresql-client

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

RUN mkdir -p /run/secrets && \
    chmod 750 /run/secrets && \
    chown nodejs:nodejs /run/secrets

WORKDIR /app

COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

USER nodejs

EXPOSE 3004
CMD ["npm", "run", "dev"]
