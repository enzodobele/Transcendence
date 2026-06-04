#!/bin/sh
echo "provision.sh: Starting pgAdmin provisioning..."

export PGADMIN_DEFAULT_PASSWORD_FILE="/run/secrets/pgadmin_password"

echo "provision.sh: Copied secrets to pgAdmin storage and set permissions."
exec /entrypoint.sh