#!/bin/sh
set -e

# Récupère les identifiants depuis les secrets
export DB_USER=$(cat /run/secrets/db_user)
export DB_NAME=$(cat /run/secrets/db_name)
export DB_PASSWORD=$(cat /run/secrets/db_password)
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"

echo "DATABASE_URL: $DATABASE_URL"  # Debug
echo "Waiting for database..."
timeout 30s sh -c 'until pg_isready -h db -p 5432 -U "$DB_USER"; do sleep 1; done'

echo "Applying Prisma migrations..."
npx prisma migrate deploy || { echo "Migration failed"; exit 1; }

echo "Starting backend..."
su nodejs -c "$@"