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

# Optionnel pour le dev (Portainer / PGAdmin)
echo -n "admin"						> "$SECRETS_DIR/pgadmin_password.txt"
echo -n "admin123456789"			> "$SECRETS_DIR/portainer_password.txt"

# =============================================
# 🔴 ENVIRONNEMENT DE PROD (Noms simples + Passwords forts)
# =============================================
echo -n "chessguard_prod_user" > "$SECRETS_DIR/prod_db_user.txt"
echo -n "chessguard_prod_db"   > "$SECRETS_DIR/prod_db_name.txt"
generate_password              > "$SECRETS_DIR/prod_db_password.txt"
generate_password              > "$SECRETS_DIR/prod_jwt_secret.txt"

# =============================================
# 🔒 Permissions strictes
# =============================================
chgrp 1001 "$SECRETS_DIR"/*.txt 2>/dev/null || chgrp 1001 "$SECRETS_DIR"/*.txt
chmod 640 "$SECRETS_DIR"/*.txt
chmod 750 "$SECRETS_DIR"

sudo chgrp 0 "$SECRETS_DIR/pgadmin_password.txt"
chmod 640 "$SECRETS_DIR/pgadmin_password.txt"

echo -e "${GREEN}✅ Done! All Dev & Prod secrets generated cleanly in: $SECRETS_DIR${NC}"