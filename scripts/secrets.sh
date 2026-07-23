#!/bin/bash

SECRETS_DIR="./src/secrets"

GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Sécurité : on vérifie si le dossier contient déjà des choses
if [ -d "$SECRETS_DIR" ] && [ "$(ls -A "$SECRETS_DIR")" ]; then
    echo -e "${YELLOW}⚠️  The secrets directory is not empty. Generation aborted to avoid breaking the DB.${NC}"
    exit 0
fi

mkdir -p "$SECRETS_DIR"

generate_password() {
    LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32
}

echo -e "${GREEN}🔐 Generating secrets...${NC}"

# =============================================
# 🟢 ENVIRONNEMENT DE DEV (Noms simples et fixes)
# =============================================
echo -n "postgres"					> "$SECRETS_DIR/db_user.txt"
echo -n "chessguard"				> "$SECRETS_DIR/db_name.txt"
echo -n "p"							> "$SECRETS_DIR/db_password.txt"
echo -n "my_super_secret_jwt_key"	> "$SECRETS_DIR/jwt_secret.txt"

# Optional for dev (Portainer; the PGAdmin password comes from .env)
echo -n "admin123456789"			> "$SECRETS_DIR/portainer_password.txt"

# =============================================
# 🔴 ENVIRONNEMENT DE PROD (Noms simples + Passwords forts)
# =============================================
echo -n "chessguard_prod_user" > "$SECRETS_DIR/prod_db_user.txt"
echo -n "chessguard_prod_db"   > "$SECRETS_DIR/prod_db_name.txt"
generate_password              > "$SECRETS_DIR/prod_db_password.txt"
generate_password              > "$SECRETS_DIR/prod_jwt_secret.txt"

# =============================================
# 🔒 Permissions
# =============================================
# Owner-only: inside the containers, only the entrypoints (running as root)
# read these files before dropping to 'nodejs'.
chmod 600 "$SECRETS_DIR"/*.txt
chmod 700 "$SECRETS_DIR"

echo -e "${GREEN}✅ Done! All Dev & Prod secrets generated cleanly in: $SECRETS_DIR${NC}"
