#!/bin/sh
set -e

# backend-status reads *_FILE paths in-app, so this entrypoint fetches
# from Vault and materializes those files instead of exporting values.
VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
CREDS_DIR="${VAULT_CREDS_DIR:-/vault/creds}"

echo "[+] [Status] Waiting for Vault..."
MAX_RETRIES=30
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "$VAULT_ADDR/v1/sys/health" >/dev/null 2>&1; then
    echo "[+] [Status] Vault is ready after $i attempts."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "[-] [Status] ERROR: Vault did not become ready in time." >&2
    exit 1
  fi
  sleep 2
done

ROLE_ID=$(cat "$CREDS_DIR/role_id")
SECRET_ID=$(cat "$CREDS_DIR/secret_id")
VAULT_TOKEN=$(curl -sf -X POST \
  -d "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  "$VAULT_ADDR/v1/auth/approle/login" | jq -r '.auth.client_token')
if [ -z "$VAULT_TOKEN" ] || [ "$VAULT_TOKEN" = "null" ]; then
  echo "[-] [Status] CRITICAL ERROR: AppRole login failed." >&2
  exit 1
fi
unset ROLE_ID SECRET_ID

kv_field() {
  curl -sf -H "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/secret/data/chessguard/$1" | jq -er ".data.data.$2"
}

APP_SECRETS_DIR="/tmp/app-secrets"
mkdir -p "$APP_SECRETS_DIR"
chmod 700 "$APP_SECRETS_DIR"

write_secret_file() {
  rm -f "$APP_SECRETS_DIR/$1"
  printf '%s' "$2" > "$APP_SECRETS_DIR/$1"
  chmod 400 "$APP_SECRETS_DIR/$1"
}

echo "[+] [Status] Fetching secrets from Vault..."
write_secret_file db_user "$(kv_field db user)"
write_secret_file db_name "$(kv_field db name)"
write_secret_file db_password "$(kv_field db password)"
write_secret_file jwt_secret "$(kv_field jwt secret)"
unset VAULT_TOKEN

export DB_USER_FILE="$APP_SECRETS_DIR/db_user"
export DB_NAME_FILE="$APP_SECRETS_DIR/db_name"
export DB_PASSWORD_FILE="$APP_SECRETS_DIR/db_password"
export JWT_SECRET_FILE="$APP_SECRETS_DIR/jwt_secret"

echo "[+] Starting backend-status..."
exec "$@"
