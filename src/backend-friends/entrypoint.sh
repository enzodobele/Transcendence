#!/bin/sh
set -e

# Vault settings (AppRole creds mounted read-only)
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
CREDS_DIR="${VAULT_CREDS_DIR:-/vault/creds}"

# Wait for Vault (health endpoint returns 200 only when unsealed+active)
echo "[+] [Friends] Waiting for Vault..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
    echo "[+] [Friends] Vault is ready after $i attempts."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "[-] [Friends] ERROR: Vault did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done

# AppRole login
ROLE_ID=$(cat "$CREDS_DIR/role_id")
SECRET_ID=$(cat "$CREDS_DIR/secret_id")
VAULT_TOKEN=$(curl -sf -X POST \
  -d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  "$VAULT_ADDR/v1/auth/approle/login" | jq -r '.auth.client_token')
if [ -z "$VAULT_TOKEN" ] || [ "$VAULT_TOKEN" = "null" ]; then
  echo "[-] [Friends] CRITICAL ERROR: AppRole login failed." >&2
  exit 1
fi
unset ROLE_ID SECRET_ID

# Fetch secrets from KV v2
kv_field() {
  curl -sf -H "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/secret/data/chessguard/$1" | jq -er ".data.data.$2"
}

echo "[+] [Friends] Fetching secrets from Vault..."
DB_USER=$(kv_field db user)
DB_NAME=$(kv_field db name)
DB_PASSWORD=$(kv_field db password)
JWT_SECRET=$(kv_field jwt secret)
unset VAULT_TOKEN

# JWT file for the app (same UID: no chown needed)
APP_SECRETS_DIR="/tmp/app-secrets"
mkdir -p "$APP_SECRETS_DIR"
chmod 700 "$APP_SECRETS_DIR"
rm -f "$APP_SECRETS_DIR/jwt_secret"
printf '%s' "$JWT_SECRET" > "$APP_SECRETS_DIR/jwt_secret"
chmod 400 "$APP_SECRETS_DIR/jwt_secret"
export JWT_SECRET_FILE="$APP_SECRETS_DIR/jwt_secret"
unset JWT_SECRET


# DATABASE_URL
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public"
echo "[+] [Friends] DATABASE_URL configured."

# Wait for the database (with timeout)
echo "[+] [Friends] Waiting for database to be ready..."
MAX_RETRIES=30
RETRY_INTERVAL=1

for i in $(seq 1 $MAX_RETRIES); do
  if pg_isready -h db -p 5432 -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "[+] [Friends] Database is ready after $i attempts."
    break
  fi

  if [ $i -eq $MAX_RETRIES ]; then
    echo "[-] [Friends] ERROR: Database did not start in time." >&2
    exit 1
  fi

  echo "[+] [Friends] Retrying in $RETRY_INTERVAL second(s)..."
  sleep $RETRY_INTERVAL
done

echo "[+] Starting backend-friends..."
exec "$@"
