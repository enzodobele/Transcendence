#!/bin/sh
set -e

# Lit les secrets via les variables d'environnement (PostgreSQL 16+)
# OU via les fichiers (pour PostgreSQL 15)
export DB_USER=$(cat /run/secrets/db_user 2>/dev/null || echo "postgres")
export DB_NAME=$(cat /run/secrets/db_name 2>/dev/null || echo "chessguard")
export DB_PASSWORD=$(cat /run/secrets/db_password 2>/dev/null || echo "p")
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"

echo "DATABASE_URL: $DATABASE_URL"
echo "Waiting for database..."
timeout 30s sh -c 'until pg_isready -h db -p 5432 -U "$DB_USER"; do sleep 1; done'

echo "Applying Prisma schema..."
npx prisma db push --skip-generate || { echo "Prisma push failed"; exit 1; }

echo "Starting backend..."
exec "$@"