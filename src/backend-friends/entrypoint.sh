#!/bin/sh
set -e

read_secret_strict() {
  local secret_name="$1"
  local secret_path="/run/secrets/$secret_name"

  if [ ! -s "$secret_path" ]; then
    echo "[-] CRITICAL ERROR: Secret '$secret_name' is missing or empty at $secret_path" >&2
    exit 1
  fi

  cat "$secret_path" | tr -d '\n'
}

echo "[+] [Friends] Loading secrets..."
export DB_USER=$(read_secret_strict "db_user")
export DB_NAME=$(read_secret_strict "db_name")
export DB_PASSWORD=$(read_secret_strict "db_password")

export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public"
echo "[+] [Friends] DATABASE_URL configurée."

echo "[+] [Friends] Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=1

for i in $(seq 1 $MAX_RETRIES); do
  if pg_isready -h db -p 5432 -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "[+] [Friends] Database is ready after $i attempts."
    break
  fi

  if [ $i -eq $MAX_RETRIES ]; then
    echo "[-] ERROR: Database did not start in time." >&2
    exit 1
  fi

  sleep $RETRY_INTERVAL
done

echo "[+] Starting backend-friends..."
exec "$@"
