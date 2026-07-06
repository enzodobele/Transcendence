#!/bin/sh
set -e

# =============================================
# Récupération des secrets depuis Vault (AppRole)
# =============================================
echo "[+] [Game] Authentification à Vault..."
export VAULT_ADDR="http://vault:8200"

ROLE_ID=$(cat /vault/role_id | tr -d '\n')
SECRET_ID=$(cat /vault/secret_id | tr -d '\n')

VAULT_TOKEN=$(curl -s --request POST \
  --data "{\"role_id\":\"$ROLE_ID\",\"secret_id\":\"$SECRET_ID\"}" \
  "$VAULT_ADDR/v1/auth/approle/login" \
  | grep -o '"client_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$VAULT_TOKEN" ]; then
  echo "[-] [Game] ERREUR: login Vault échoué (jeton vide)" >&2
  exit 1
fi

vault_get() {
  curl -s --header "X-Vault-Token: $VAULT_TOKEN" \
    "$VAULT_ADDR/v1/secret/data/chessguard/$1" \
    | grep -o "\"$2\":\"[^\"]*\"" | cut -d'"' -f4
}

export DB_USER=$(vault_get db user)
export DB_NAME=$(vault_get db name)
export DB_PASSWORD=$(vault_get db password)
export JWT_SECRET=$(vault_get jwt secret)

echo "[+] [Game] Secrets récupérés depuis Vault ✅"

# =============================================
# Construction de DATABASE_URL
# =============================================
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public"
echo "[+] [Game] DATABASE_URL configurée."

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
# Démarrage du backend
# =============================================
echo "[+] Starting backend-game..."
exec "$@"