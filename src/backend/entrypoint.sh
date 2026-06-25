#!/bin/sh
set -e

# =============================================
# Fonction utilitaire pour lire un secret
# =============================================
read_secret_strict() {
  local secret_name="$1"
  local secret_path="/run/secrets/$secret_name"

  if [ ! -s "$secret_path" ]; then
    echo "[-] CRITICAL ERROR: Secret '$secret_name' is missing or empty at $secret_path" >&2
    exit 1
  fi

  cat "$secret_path" | tr -d '\n'  # ✅ Supprime les sauts de ligne
}

# =============================================
# Lecture des secrets
# =============================================
echo "[+] Loading secrets..."
export DB_USER=$(read_secret_strict "db_user")
export DB_NAME=$(read_secret_strict "db_name")
export DB_PASSWORD=$(read_secret_strict "db_password")
export JWT_SECRET=$(read_secret_strict "jwt_secret")

# =============================================
# Construction de DATABASE_URL
# =============================================
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public"
echo "[+] DATABASE_URL: $DATABASE_URL"

# =============================================
# Attente de la base de données (avec timeout)
# =============================================
echo "[+] Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=1

for i in $(seq 1 $MAX_RETRIES); do
  if pg_isready -h db -p 5432 -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "[+] Database is ready after $i attempts."
    break
  fi

  if [ $i -eq $MAX_RETRIES ]; then
    echo "[-] ERROR: Database did not start in time." >&2
    exit 1
  fi

  echo "[+] Retrying in $RETRY_INTERVAL second(s)..."
  sleep $RETRY_INTERVAL
done

# =============================================
# Application du schéma Prisma via les Migrations
# =============================================
echo "[+] Applying Prisma migrations..."
if ! npx prisma migrate deploy; then
  echo "[-] ERROR: Failed to apply Prisma migrations." >&2
  exit 1
fi
echo "[+] Prisma migrations applied successfully."

# =============================================
# Lancement de la seed (Automatique si configuré)
# =============================================
# Note : 'prisma migrate deploy' ne lance pas le seed tout seul,
# on peut donc garder ton appel manuel ici si tu veux qu'il se joue à chaque reset de pile.
echo "[+] Checking or applying database seed..."
if ! npx prisma db seed; then
  echo "[-] WARNING: Failed to seed the database. Moving on..." >&2
fi

# =============================================
# Démarrage du backend
# =============================================
echo "[+] Starting backend..."
exec "$@"