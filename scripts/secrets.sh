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
printf "p" > "$SECRETS_DIR/db_password.txt"
printf "p" > "$SECRETS_DIR/portainer_password.txt"
printf "p" > "$SECRETS_DIR/pgadmin_password.txt"

printf "chessguard" > "$SECRETS_DIR/db_name.txt"
printf "postgres" > "$SECRETS_DIR/db_user.txt"
printf "admin@example.com" > "$SECRETS_DIR/pgadmin_email.txt"

# Restrictive permissions (read/write for owner only)
chmod 600 "$SECRETS_DIR"/*.txt
# Directory access permission
chmod 700 "$SECRETS_DIR"

echo -e "${GREEN}✅ Done. Secure secrets generated in: $SECRETS_DIR${NC}"