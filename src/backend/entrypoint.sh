#!/bin/sh

# Attend que la DB soit prête
echo "Waiting for database to be ready..."
while ! nc -z db 5432; do
  sleep 1
done

# Applique les migrations Prisma (sans toucher à node_modules)
echo "Applying Prisma migrations..."
npx prisma db push --skip-generate  # <-- Évite de régénérer le client

# Lance l'application
exec "$@"