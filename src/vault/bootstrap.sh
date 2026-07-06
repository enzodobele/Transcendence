#!/bin/sh
# =========================================================================
# 🔐 Bootstrap Vault : attend, initialise si besoin, descelle.
# =========================================================================

export VAULT_ADDR="http://vault:8200"
KEYS_FILE="/vault/secrets/init.txt"

# 1. Attendre que le serveur Vault réponde
#    (vault status renvoie 1 s'il est injoignable, 0 ou 2 sinon)
echo "[bootstrap] Attente de Vault..."
while true; do
  vault status >/dev/null 2>&1
  [ $? -ne 1 ] && break
  sleep 1
done

# 2. Initialiser SEULEMENT si ce n'est pas déjà fait
if vault status 2>/dev/null | grep -q 'Initialized.*false'; then
  echo "[bootstrap] Initialisation de Vault..."
  vault operator init -key-shares=5 -key-threshold=3 > "$KEYS_FILE"
fi

# 3. Desceller SEULEMENT si scellé (avec les 3 premières clés du fichier)
if vault status 2>/dev/null | grep -q 'Sealed.*true'; then
  echo "[bootstrap] Descellement de Vault..."
  grep '^Unseal Key' "$KEYS_FILE" | head -n 3 | while read -r line; do
    key=$(echo "$line" | awk '{print $NF}')
    vault operator unseal "$key" >/dev/null
  done
fi

echo "[bootstrap] Vault prêt ✅"
vault status

# =========================================================================
# Provisioning des secrets
# =========================================================================

# S'authentifier avec le token root (lu depuis init.txt)
VAULT_TOKEN=$(grep 'Initial Root Token' "$KEYS_FILE" | awk '{print $NF}')
export VAULT_TOKEN

# Activer le moteur de secrets KV v2 sur le chemin "secret/" (idempotent)
vault secrets enable -path=secret kv-v2 2>/dev/null || true

# Charger les identifiants DB depuis les fichiers plaintext vers Vault
vault kv put secret/chessguard/db \
  user="$(cat /secrets/prod_db_user.txt)" \
  name="$(cat /secrets/prod_db_name.txt)" \
  password="$(cat /secrets/prod_db_password.txt)"

# Charger la clé JWT
vault kv put secret/chessguard/jwt \
  secret="$(cat /secrets/prod_jwt_secret.txt)"

echo "[bootstrap] Secrets charg\u00e9s dans Vault \u2705"

# =========================================================================
# Permissions : policy + AppRole pour les backends
# =========================================================================

# Policy en LECTURE SEULE sur les secrets ChessGuard
vault policy write chessguard-backend - <<'EOF'
path "secret/data/chessguard/*" {
  capabilities = ["read"]
}
EOF

# Activer la méthode d'auth AppRole (idempotent)
vault auth enable approle 2>/dev/null || true

# Créer/mettre à jour le rôle, lié à notre policy
vault write auth/approle/role/chessguard-backend \
  token_policies="chessguard-backend" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=0 \
  secret_id_num_uses=0

# Écrire role_id (stable) + un secret_id (généré) pour que les backends s'authentifient
vault read  -field=role_id   auth/approle/role/chessguard-backend/role-id   > /vault/secrets/role_id
vault write -f -field=secret_id auth/approle/role/chessguard-backend/secret-id > /vault/secrets/secret_id

echo "[bootstrap] Policy + AppRole configur\u00e9s \u2705"
