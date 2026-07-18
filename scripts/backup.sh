#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SECRETS_DIR="$ROOT_DIR/src/secrets"
BACKUP_DIR="$ROOT_DIR/backups"
STATUS_FILE="$ROOT_DIR/src/nginx/html/backup-status.json"
DB_CONTAINER="${DB_CONTAINER:-chessguard-db}"

if [ ! -f "$SECRETS_DIR/db_user.txt" ] || [ ! -f "$SECRETS_DIR/db_password.txt" ] || [ ! -f "$SECRETS_DIR/db_name.txt" ]; then
  echo "[backup] Missing DB secret files in $SECRETS_DIR"
  exit 1
fi

DB_USER=$(tr -d '\n' < "$SECRETS_DIR/db_user.txt")
DB_PASSWORD=$(tr -d '\n' < "$SECRETS_DIR/db_password.txt")
DB_NAME=$(tr -d '\n' < "$SECRETS_DIR/db_name.txt")

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")
FILE_NAME="${DB_NAME}_${TIMESTAMP}.sql.gz"
OUTPUT_FILE="$BACKUP_DIR/$FILE_NAME"

if ! docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  echo "[backup] Database container '$DB_CONTAINER' is not running"
  exit 1
fi

docker exec -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip -c > "$OUTPUT_FILE"

LAST_BACKUP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
cat > "$STATUS_FILE" <<EOF
{
  "lastBackup": "$LAST_BACKUP",
  "file": "$FILE_NAME"
}
EOF

# Keep only the 7 most recent backups.
ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f

echo "[backup] Created $OUTPUT_FILE"
