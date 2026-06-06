#!/bin/sh
set -e

# Fonction utilitaire pour lire un secret de manière stricte
read_secret_strict() {
  local secret_name="$1"
  local secret_path="/run/secrets/$secret_name"

  # Vérifie si le fichier existe et n'est pas vide
  if [ ! -s "$secret_path" ]; then
    echo "[-] CRITICAL ERROR: Secret '$secret_name' is missing or empty at $secret_path" >&2
    exit 1
  fi

  # Lit le contenu du secret
  cat "$secret_path"
}

# Assignation stricte des variables (Crash immédiat si échec)
export DB_USER=$(read_secret_strict "db_user")
export DB_NAME=$(read_secret_strict "db_name")
export DB_PASSWORD=$(read_secret_strict "db_password")
export JWT_SECRET=$(read_secret_strict "jwt_secret")

# Construction de l'URL de connexion à la base de données
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}"

echo "[+] DATABASE_URL générée avec succès."
echo "[+] Waiting for database..."
timeout 30s sh -c 'until pg_isready -h db -p 5432 -U "$DB_USER"; do sleep 1; done'

echo "[+] Applying Prisma schema..."
npx prisma db push --skip-generate || { echo "[-] Prisma push failed"; exit 1; }

echo "[+] Starting backend..."
exec "$@"