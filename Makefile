# =========================================================================
# 🎮 ChessGuard Makefile
# =========================================================================

NAME = chessguard
DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

# 📂 Fichiers de configuration Docker Compose
COMPOSE_DEV  = $(DOCKER_COMPOSE) -f docker-compose.yml -p $(NAME)_dev
COMPOSE_PROD = $(DOCKER_COMPOSE) -f docker-compose.prod.yml -p $(NAME)_prod

# ⚙️ Variable dynamique (ex: make logs SERVICE=backend-auth)
SERVICE ?=  

.PHONY: up down rebuild restart logs ps exec db-seed db-migrate format \
        prod prod-down prod-rebuild prod-logs prod-ps prod-exec prod-db-seed \
        clean fclean

# =========================================================================
# 🛠️ ENVIRONNEMENT DE DÉVELOPPEMENT (Local)
# =========================================================================

up:
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

prod:
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

# Supprime les conteneurs de dev mais GARDE les volumes (ta DB de test reste intacte)
clean:
	@echo "[-] Nettoyage des conteneurs de Dev..."
	@$(COMPOSE_DEV) down --remove-orphans

# Rase TOUT le dev (Conteneurs, images de dev et volumes/DB de test)
fclean:
	@echo "[!] Purge complète de l'environnement de DEV..."
	@$(COMPOSE_DEV) down -v --rmi all --remove-orphans
	@echo "[+] Nettoyage du cache de build de dev..."
	docker builder prune -f

# =========================================================================
# 🚨 NETTOYAGE & MAINTENANCE (PRODUCTION - À manipuler avec précaution)
# =========================================================================

# Arrête proprement la prod sans toucher aux données des joueurs
prod-clean:
	@echo "[-] Arrêt et nettoyage des conteneurs de PRODUCTION..."
	@$(COMPOSE_PROD) down --remove-orphans

# ATTENTION : Supprime la prod, réinitialise la DB de prod et supprime les images de prod
prod-fclean:
	@echo "[!] ⚠️ DANGER : Purge complète de la PRODUCTION dans 5 secondes..."
	@sleep 5
	@$(COMPOSE_PROD) down -v --rmi all --remove-orphans
	docker builder prune -f