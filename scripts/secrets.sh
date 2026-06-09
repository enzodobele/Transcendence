#!/bin/bash

SECRETS_DIR="./src/secrets"

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

# Safety: only generate if the folder does not exist or is empty
if [ -d "$SECRETS_DIR" ] && [ "$(ls -A "$SECRETS_DIR")" ]; then
    echo -e "${YELLOW}⚠️  The secrets directory is not empty. Generation aborted to avoid breaking the DB.${NC}"
    echo -e "Use 'rm -rf $SECRETS_DIR/*' if you really want to regenerate everything."
    exit 0
fi

mkdir -p "$SECRETS_DIR"

#### to keep for later for more secured random passwords.
# generate_password() {
#     # Use /dev/urandom for real entropy
#     LC_ALL=C tr -dc 'A-Za-z0-9_.\-+=@!' < /dev/urandom | head -c 32
# }

# echo -e "${GREEN}🔐 Generating random passwords...${NC}"
# generate_password > "$SECRETS_DIR/db_root_password.txt"
# generate_password > "$SECRETS_DIR/db_password.txt"
# generate_password > "$SECRETS_DIR/portainer_password.txt"
# generate_password > "$SECRETS_DIR/pgadmin_password.txt"

#### For development
# Génère les secrets pour la base de données (sans saut de ligne)
printf "postgres" > "$SECRETS_DIR/db_user.txt"
printf "chessguard" > "$SECRETS_DIR/db_name.txt"
printf "p" > "$SECRETS_DIR/db_password.txt"

# Génère les secrets pour PGAdmin
printf "admin" > "$SECRETS_DIR/pgadmin_password.txt"

# Génère les secrets pour Portainer
printf "admin123456789" > "$SECRETS_DIR/portainer_password.txt"

# Génère le JWT_SECRET pour l'authentification
printf "my_super_secret_jwt_key" > "$SECRETS_DIR/jwt_secret.txt"

# =============================================
# 🔐 Applique les permissions correctes
# =============================================
# Change le groupe des fichiers pour le groupe 1001 (celui de nodejs dans Docker)
sudo chgrp 1001 "$SECRETS_DIR"/*.txt 2>/dev/null || chgrp 1001 "$SECRETS_DIR"/*.txt

# Permissions : lecture/écriture pour le propriétaire, lecture pour le groupe
chmod 640 "$SECRETS_DIR"/*.txt

# Permissions du dossier : accès complet pour le propriétaire, lecture/exécution pour le groupe
chmod 750 "$SECRETS_DIR"

# permissions pour pgadmin secrets
sudo chgrp 0 "$SECRETS_DIR/pgadmin_password.txt"
chmod 640 "$SECRETS_DIR/pgadmin_password.txt"


echo -e "${GREEN}✅ Done. Secure secrets generated in: $SECRETS_DIR${NC}"
echo -e "Permissions set to 640 for files and 750 for directory, group 1001."