#!/bin/sh
echo "provision.sh: Starting pgAdmin provisioning..."

export PGADMIN_DEFAULT_EMAIL="$(cat /run/secrets/pgadmin_email)"
export PGADMIN_DEFAULT_PASSWORD_FILE="/run/secrets/pgadmin_password"
# mkdir -p /var/lib/pgadmin/storage/${PGADMIN_USER_CONFIG_DIR}
# # Copie les secrets dans le dossier utilisateur
# cp /run/secrets/pgadmin_password /var/lib/pgadmin/storage/${PGADMIN_USER_CONFIG_DIR}/pgadmin_password
# cp /run/secrets/pgadmin_email /var/lib/pgadmin/storage/${PGADMIN_USER_CONFIG_DIR}/pgadmin_email
# chown -R 5050 /var/lib/pgadmin/storage/${PGADMIN_USER_CONFIG_DIR}
echo "provision.sh: Copied secrets to pgAdmin storage and set permissions."
exec /entrypoint.sh