# =========================================================================
# 🎮 ChessGuard Makefile
# =========================================================================

NAME = chessguard
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

# 📂 Fichiers de configuration Docker Compose
COMPOSE_DEV  = $(DOCKER_COMPOSE) -f docker-compose.yml -p $(NAME)_dev
COMPOSE_PROD = $(DOCKER_COMPOSE) -f docker-compose.prod.yml -p $(NAME)_prod

SERVICE ?=

SECRETS_DIR := src/secrets
REQUIRED_PROD_SECRETS := \
    $(SECRETS_DIR)/prod_db_user.txt \
    $(SECRETS_DIR)/prod_db_name.txt \
    $(SECRETS_DIR)/prod_db_password.txt \
    $(SECRETS_DIR)/prod_jwt_secret.txt

REQUIRED_DEV_SECRETS := \
    $(SECRETS_DIR)/db_user.txt \
    $(SECRETS_DIR)/db_name.txt \
    $(SECRETS_DIR)/db_password.txt \
    $(SECRETS_DIR)/jwt_secret.txt \
    $(SECRETS_DIR)/pgadmin_password.txt \
    $(SECRETS_DIR)/portainer_password.txt


.PHONY: up down rebuild restart logs ps exec db-seed db-migrate format \
        prod prod-down prod-rebuild prod-logs prod-ps prod-exec prod-db-seed \
        clean fclean prod-clean prod-fclean

# =========================================================================
# 🛠️ ENVIRONNEMENT DE DÉVELOPPEMENT (Local)
# =========================================================================

define check_dev_secrets
    @for file in $(REQUIRED_DEV_SECRETS); do \
        if [ ! -f $$file ]; then \
            echo "\033[0;31m❌ ERREUR CRITIQUE (DEV) : Le fichier de secret '$$file' est manquant !\033[0m"; \
            echo "\033[0;33m💡 Lance ton script de génération de secrets avant de démarrer.\033[0m"; \
            exit 1; \
        fi \
    done
endef

up:
	$(call check_dev_secrets)
	@echo "[+] Lancement de l'environnement de DEV..."
	@$(COMPOSE_DEV) up -d --build $(SERVICE)

down:
	@echo "[-] Arrêt de l'environnement de DEV..."
	@$(COMPOSE_DEV) down $(SERVICE)

rebuild: down up

restart:
	@$(COMPOSE_DEV) restart $(SERVICE)

logs:
	@$(COMPOSE_DEV) logs -f $(SERVICE)

ps:
	@$(COMPOSE_DEV) ps --format 'table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}'

exec:
	@$(COMPOSE_DEV) exec $(SERVICE) sh

db-seed:
	@echo "[+] Exécution du seeding de la DB (DEV)..."
	@$(COMPOSE_DEV) exec backend-auth npm run db:seed

db-migrate:
	@echo "[+] Exécution des migrations Prisma (DEV)..."
	@DB_USER=$$(cat src/secrets/db_user.txt) \
	DB_PASSWORD=$$(cat src/secrets/db_password.txt) \
	DB_NAME=$$(cat src/secrets/db_name.txt) \
	docker exec -it \
	-e DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/$$DB_NAME?schema=public" \
	-e SHADOW_DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/shadow_db?schema=public" \
	chessguard-backend-auth npx prisma migrate dev

format:
	@echo "[+] Lancement du formatage du code..."
	@$(COMPOSE_DEV) exec backend-game npm run format || true
	@$(COMPOSE_DEV) exec backend-auth npm run format || true
	@$(COMPOSE_DEV) exec backend-matchmaking npm run format || true
	@$(COMPOSE_DEV) exec frontend npm run format || true

# =========================================================================
# 🚀 ENVIRONNEMENT DE PRODUCTION (VPS / Serveur)
# =========================================================================

define check_prod_secrets
    @for file in $(REQUIRED_PROD_SECRETS); do \
        if [ ! -f $$file ]; then \
            echo "\033[0;31m❌ ERREUR CRITIQUE (PROD) : Le fichier de secret '$$file' est manquant !\033[0m"; \
            echo "\033[0;33m💡 Lance ton script de génération de secrets avant de lancer la production.\033[0m"; \
            exit 1; \
        fi \
    done
endef

prod:
	$(call check_prod_secrets)
	@echo "[+] Lancement de l'environnement de PRODUCTION..."
	@$(COMPOSE_PROD) up -d --build $(SERVICE)
	@echo "[+] Infrastructure de production opérationnelle !"

prod-down:
	@echo "[-] Arrêt de l'environnement de PRODUCTION..."
	@$(COMPOSE_PROD) down $(SERVICE)

prod-rebuild: prod-down prod

prod-logs:
	@$(COMPOSE_PROD) logs -f $(SERVICE)

prod-ps:
	@$(COMPOSE_PROD) ps --format 'table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}'

prod-exec:
	@$(COMPOSE_PROD) exec $(SERVICE) sh

prod-db-seed:
	@echo "[!] ATTENTION : Seeding de la DB de PRODUCTION..."
	@$(COMPOSE_PROD) exec backend-auth npx prisma db seed

# =========================================================================
# 🧹 NETTOYAGE & MAINTENANCE (DÉVELOPPEMENT)
# =========================================================================

clean:
	@echo "[-] Nettoyage des conteneurs de Dev..."
	@$(COMPOSE_DEV) down --remove-orphans

fclean:
	@echo "[!] Purge complète de l'environnement de DEV..."
	@$(COMPOSE_DEV) down -v --rmi all --remove-orphans

# =========================================================================
# 🚨 NETTOYAGE & MAINTENANCE (PRODUCTION)
# =========================================================================

prod-clean:
	@echo "[-] Arrêt et nettoyage des conteneurs de PRODUCTION..."
	@$(COMPOSE_PROD) down --remove-orphans

prod-fclean:
	@echo "[!] ⚠️ DANGER : Purge complète de la PRODUCTION dans 5 secondes..."
	@sleep 5
	@$(COMPOSE_PROD) down -v --rmi all --remove-orphans