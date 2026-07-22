#!/usr/bin/env bash

set -u

PROJECT="chessguard_dev"
COMPOSE_FILE="docker-compose.yml"
OVERRIDE_FILE="docker-compose.podman.yml"

SERVICES=(
    # vault
    # vault-bootstrap
    # chessguard-db
    # backend-auth
    # backend-friends
    # backend-game
    # backend-status
    # ai
    # frontend
    # mailpit
    # pgadmin
    # monitoring-prometheus
    # monitoring-grafana
    # monitoring-node-exporter
    # backend-matchmaking
    nginx
    # monitoring-cadvisor
    # portainer
)

echo "=== Détection moteur container ==="

if command -v podman >/dev/null 2>&1; then
    ENGINE="podman"
    COMPOSE="podman-compose"
    echo "=> Podman détecté"
else
    ENGINE="docker"
    COMPOSE="docker compose"
    echo "=> Docker détecté"
fi


echo
echo "=== Génération override Podman ==="


if [ "$ENGINE" = "podman" ]; then

cat > "$OVERRIDE_FILE" <<'EOF'
services:

  monitoring-cadvisor:
    volumes:
      - /:/rootfs:ro
      - /sys:/sys:ro
      - /dev/disk/:/dev/disk:ro
      - /run/podman/podman.sock:/var/run/docker.sock:ro

  monitoring-prometheus:
    depends_on: []

  monitoring-grafana:
    depends_on: []

EOF

else

cat > "$OVERRIDE_FILE" <<'EOF'
services: {}
EOF

fi


echo
echo "=== Nettoyage anciens containers ==="

for SERVICE in "${SERVICES[@]}"; do

echo
echo "========================================"
echo " Starting: $SERVICE"
echo "========================================"

$COMPOSE \
    -f "$COMPOSE_FILE" \
    -f "$OVERRIDE_FILE" \
    -p "$PROJECT" \
    up -d "$SERVICE"


CID=$($ENGINE ps \
    --filter name="$SERVICE" \
    --format "{{.ID}}")


if [ -z "$CID" ]; then

    echo
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "$SERVICE KO : container absent"
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"

    echo "--- compose config ---"
    $COMPOSE \
        -f "$COMPOSE_FILE" \
        -f "$OVERRIDE_FILE" \
        config "$SERVICE"

else

    STATE=$($ENGINE inspect "$CID" \
        --format "{{.State.Status}}")


    if [ "$STATE" != "running" ]; then

        echo
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        echo "$SERVICE KO : état=$STATE"
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!"

        echo
        echo "--- LOGS ---"
        $ENGINE logs "$CID" --tail 100

    else

        echo "OK: $SERVICE"

    fi

fi


echo
echo "=== Nettoyage stack après test: $SERVICE ==="

$COMPOSE \
    -f "$COMPOSE_FILE" \
    -f "$OVERRIDE_FILE" \
    -p "$PROJECT" \
    down \
    --remove-orphans \
    >/dev/null 2>&1 || true

echo "Nettoyé: $SERVICE + dépendances"
done



echo
echo "=== Résumé ==="

$ENGINE ps -a \
    --filter label=io.podman.compose.project="$PROJECT" \
    || true