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
DB_CONTAINER="${DB_CONTAINER:-chessguard-db}"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "[restore] Database container '$DB_CONTAINER' is not running"
  exit 1
fi

# DB creds come from the Vault-Agent-rendered files inside the db container:
# no host-side secret files or Vault tokens needed.
DB_USER=$(docker exec "$DB_CONTAINER" cat /vault/secrets/db_user)
DB_PASSWORD=$(docker exec "$DB_CONTAINER" cat /vault/secrets/db_password)
DB_NAME=$(docker exec "$DB_CONTAINER" cat /vault/secrets/db_name)

echo "[restore] Resetting database schema..."
docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  psql -U "$DB_USER" -d "$DB_NAME" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

if echo "$INPUT_FILE" | grep -q '\.gz$'; then
  gzip -dc "$INPUT_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
else
  cat "$INPUT_FILE" | docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"
fi

echo "[restore] Restore completed from $INPUT_FILE"
