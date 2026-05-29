#!/bin/sh
set -e

export DB_PASSWORD=$(cat /run/secrets/db_password)
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"

echo "Waiting for database..."
timeout 30s sh -c 'until pg_isready -h db -p 5432 -U "$DB_USER"; do sleep 1; done'

echo "Applying Prisma migrations..."
npx prisma migrate deploy || { echo "Migration failed"; exit 1; }

echo "Starting backend..."
su nodejs -c "$@"