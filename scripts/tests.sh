#!/bin/bash
SECRETS_DIR="./src/secrets"

generate_password() {
    LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 32
}
echo -n "chessguard_prod_user" > "$SECRETS_DIR/prod_db_user.txt"
echo -n "chessguard_prod_db"   > "$SECRETS_DIR/prod_db_name.txt"
generate_password              > "$SECRETS_DIR/prod_db_password.txt"
generate_password              > "$SECRETS_DIR/prod_jwt_secret.txt"

sudo chgrp 1001 "$SECRETS_DIR"/*.txt 2>/dev/null || chgrp 1001 "$SECRETS_DIR"/*.txt
chmod 640 "$SECRETS_DIR"/*.txt
chmod 750 "$SECRETS_DIR"