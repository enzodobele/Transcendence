#!/bin/sh
# Vault bootstrap: init (first run), unseal, and provision policies,
# AppRoles, and application secrets.
set -e

INIT_ENV="/vault/init/init.env"
SERVICES="backend-auth backend-friends backend-game backend-matchmaking backend-status agent-db agent-tools"

echo "[bootstrap] Waiting for Vault to respond..."
i=0
while :; do
  rc=0
  vault status >/dev/null 2>&1 || rc=$?
  # 0 = unsealed, 2 = sealed: both mean the server is reachable.
  if [ "$rc" -eq 0 ] || [ "$rc" -eq 2 ]; then break; fi
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[bootstrap] ERROR: Vault unreachable after 60s." >&2
    exit 1
  fi
  sleep 2
done

if vault status 2>/dev/null | grep -q "Initialized.*true"; then
  echo "[bootstrap] Vault already initialized."
  if [ ! -f "$INIT_ENV" ]; then
    echo "[bootstrap] ERROR: Vault is initialized but $INIT_ENV is missing." >&2
    echo "[bootstrap] Purge the vault volume for a fresh init, or restore the file." >&2
    exit 1
  fi
else
  echo "[bootstrap] Initializing Vault (1 key share, threshold 1)..."
  INIT_OUT=$(vault operator init -key-shares=1 -key-threshold=1)
  UNSEAL_KEY=$(echo "$INIT_OUT" | grep "Unseal Key 1:" | awk '{print $NF}')
  ROOT_TOKEN=$(echo "$INIT_OUT" | grep "Initial Root Token:" | awk '{print $NF}')
  umask 077
  {
    echo "VAULT_UNSEAL_KEY=$UNSEAL_KEY"
    echo "VAULT_ROOT_TOKEN=$ROOT_TOKEN"
  } > "$INIT_ENV"
  echo "[bootstrap] Unseal key + root token written to $INIT_ENV (gitignored)."
fi

. "$INIT_ENV"

if vault status 2>/dev/null | grep -q "Sealed.*true"; then
  echo "[bootstrap] Unsealing..."
  vault operator unseal "$VAULT_UNSEAL_KEY" >/dev/null
fi

export VAULT_TOKEN="$VAULT_ROOT_TOKEN"

# KV v2 secrets engine at secret/
if ! vault secrets list | grep -q "^secret/"; then
  vault secrets enable -path=secret kv-v2
fi

# Least-privilege read policies (overwriting is idempotent).
vault policy write db-read - <<'EOF'
path "secret/data/chessguard/db" {
  capabilities = ["read"]
}
EOF

vault policy write jwt-read - <<'EOF'
path "secret/data/chessguard/jwt" {
  capabilities = ["read"]
}
EOF

vault policy write tools-read - <<'EOF'
path "secret/data/chessguard/portainer" {
  capabilities = ["read"]
}
path "secret/data/chessguard/pgadmin" {
  capabilities = ["read"]
}
EOF

if ! vault auth list | grep -q "^approle/"; then
  vault auth enable approle
fi

# secret_id_ttl=0 (non-expiring) so unattended container restarts keep
# working; the trade-off vs response wrapping is documented in VAULT.md.
for svc in backend-auth backend-friends backend-game backend-matchmaking backend-status; do
  vault write "auth/approle/role/$svc" \
    token_policies="db-read,jwt-read" \
    token_ttl=1h token_max_ttl=4h secret_id_ttl=0 >/dev/null
done
vault write auth/approle/role/agent-db \
  token_policies="db-read" \
  token_ttl=1h token_max_ttl=4h secret_id_ttl=0 >/dev/null
vault write auth/approle/role/agent-tools \
  token_policies="tools-read" \
  token_ttl=1h token_max_ttl=4h secret_id_ttl=0 >/dev/null

gen() { tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32; }

# Application secrets: generated once, stable across restarts.
if ! vault kv get secret/chessguard/db >/dev/null 2>&1; then
  echo "[bootstrap] Seeding application secrets..."
  vault kv put secret/chessguard/db \
    user="chessguard" name="chessguard" password="$(gen)" >/dev/null
  vault kv put secret/chessguard/jwt secret="$(gen)$(gen)" >/dev/null
  vault kv put secret/chessguard/portainer password="$(gen)" >/dev/null
  vault kv put secret/chessguard/pgadmin password="$(gen)" >/dev/null
fi

# AppRole credential distribution: one mounted volume per consumer.
# Backends run as UID 1001; agents run as in-container root and can read
# regardless of ownership.
for svc in $SERVICES; do
  dir="/creds/$svc"
  [ -d "$dir" ] || continue  # the prod stack mounts a subset of consumers
  if [ ! -s "$dir/secret_id" ]; then
    vault read -field=role_id "auth/approle/role/$svc/role-id" > "$dir/role_id"
    vault write -f -field=secret_id "auth/approle/role/$svc/secret-id" > "$dir/secret_id"
  fi
  chown -R 1001:1001 "$dir"
  chmod 0400 "$dir/role_id" "$dir/secret_id"
done

echo "[bootstrap] Done."
