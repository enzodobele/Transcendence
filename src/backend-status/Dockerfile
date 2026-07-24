# STAGE 1: Build
FROM docker.io/node:22-alpine AS builder

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci

COPY --chown=nodejs:nodejs . .

# STAGE 2: Runtime
FROM docker.io/node:22-alpine

# postgresql-client pour pg_dump (backup)
RUN apk add --no-cache wget postgresql-client curl jq

RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs

WORKDIR /app

COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package*.json ./
COPY --chown=nodejs:nodejs --from=builder /app/src ./src

COPY --chown=nodejs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Named volume mounted at /backups inherits this dir's ownership when empty,
# so the nodejs user (uid 1001) can write backups to it.
RUN mkdir -p /backups && chown -R nodejs:nodejs /backups

USER nodejs

ENTRYPOINT ["/app/entrypoint.sh"]

EXPOSE 3004
CMD ["npm", "run", "dev"]
