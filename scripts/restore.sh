#!/usr/bin/env sh
set -eu

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup-file.sql.gz|backup-file.sql>"
  exit 1
fi

INPUT_FILE="$1"
if [ ! -f "$INPUT_FILE" ]; then
  echo "[restore] File not found: $INPUT_FILE"
  exit 1
fi

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SECRETS_DIR="$ROOT_DIR/src/secrets"
DB_CONTAINER="${DB_CONTAINER:-chessguard-db}"

DB_USER=$(tr -d '\n' < "$SECRETS_DIR/db_user.txt")
DB_PASSWORD=$(tr -d '\n' < "$SECRETS_DIR/db_password.txt")
DB_NAME=$(tr -d '\n' < "$SECRETS_DIR/db_name.txt")

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "[restore] Database container '$DB_CONTAINER' is not running"
  exit 1
fi

if echo "$INPUT_FILE" | grep -q '\.gz$'; then
  gzip -dc "$INPUT_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
  cat "$INPUT_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
fi

echo "[restore] Restore completed from $INPUT_FILE"
