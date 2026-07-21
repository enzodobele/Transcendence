# =========================================================================
# 🎮 ChessGuard Makefile
# =========================================================================

NAME = chessguard
DOCKER_COMPOSE := docker compose

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
    $(SECRETS_DIR)/portainer_password.txt


.PHONY: up down rebuild restart logs ps exec db-seed db-migrate format backup restore \
        prod prod-down prod-rebuild prod-logs prod-ps prod-exec prod-db-seed \
        clean fclean prod-clean prod-fclean check-types

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

backup:
	@echo "[+] Lancement d'un backup PostgreSQL..."
	@./scripts/backup.sh

restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backups/<dump.sql.gz>"; exit 1; fi
	@echo "[+] Restauration de la sauvegarde $(FILE)..."
	@./scripts/restore.sh "$(FILE)"

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
	@echo "[!] ⚠️ DANGER : Purge complète de la PRODUCTION dans 5 secondes..."
	@sleep 5
	@$(COMPOSE_PROD) down -v --rmi all --remove-orphans

hclean:
	@echo "🚨 Arrêt des conteneurs et suppression des volumes de DEV..."
	@$(COMPOSE_DEV) down -v --remove-orphans
	
	@echo "🗑️ Suppression de toutes les images du projet Chessguard..."
	@if [ $$(docker images 'chessguard*' -q | wc -l) -gt 0 ]; then \
		docker rmi $$(docker images 'chessguard*' -q) --force; \
	else \
		echo "Aucune image Chessguard à supprimer."; \
	fi
	
	@echo "🧹 Purge du cache de build Docker (BuildKit)..."
	docker builder prune -a -f
	
	@echo "🧼 Nettoyage du système Docker global (réseaux, conteneurs éteints)..."
	docker system prune -f
	
	@echo "📦 Suppression des node_modules et builds locaux de chaque service..."
	rm -rf node_modules dist build .next
	rm -rf src/backend-auth/node_modules src/backend-auth/dist src/backend-auth/.prisma
	rm -rf src/backend-game/node_modules src/backend-game/dist
	rm -rf src/backend-matchmaking/node_modules src/backend-matchmaking/dist
	rm -rf src/frontend/node_modules src/frontend/.next
	
	@echo "✨ Environnement de DEV 100% purifié !"

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

prod-hclean:
	@echo "[!] ⚠️ DANGER : Purge complète de la PRODUCTION dans 5 secondes..."
	@sleep 5
	@echo "🚨 Arrêt des conteneurs et suppression des volumes de PRODUCTION..."
	@$(COMPOSE_PROD) down -v --remove-orphans
	
	@echo "🗑️ Suppression de toutes les images du projet Chessguard..."
	@if [ $$(docker images 'chessguard*' -q | wc -l) -gt 0 ]; then \
		docker rmi $$(docker images 'chessguard*' -q) --force; \
	else \
		echo "Aucune image Chessguard à supprimer."; \
	fi
	
	@echo "🧹 Purge du cache de build Docker (BuildKit)..."
	docker builder prune -a -f
	
	@echo "🧼 Nettoyage du système Docker global (réseaux, conteneurs éteints)..."
	docker system prune -f
	
	@echo "📦 Suppression des dossiers de build locaux..."
	rm -rf node_modules dist build .next
	rm -rf src/backend-auth/node_modules src/backend-auth/dist src/backend-auth/.prisma
	rm -rf src/backend-game/node_modules src/backend-game/dist
	rm -rf src/backend-matchmaking/node_modules src/backend-matchmaking/dist
	rm -rf src/frontend/node_modules src/frontend/.next
	
	@echo "✨ Infrastructure de PRODUCTION 100% purifiée !"

check-types:
	@echo "🔍 [Vérification] Analyse du dossier Matchmaking..."
	@cd src/backend-matchmaking && npx tsc --noEmit || echo "❌ Erreurs trouvées dans backend-matchmaking"
	@echo "\n🔍 [Vérification] Analyse du dossier Auth..."
	@cd src/backend-auth && npx tsc --noEmit || echo "❌ Erreurs trouvées dans backend-auth"
	@echo "\n🔍 [Vérification] Analyse du dossier Game Engine..."
	@cd src/backend-game && npx tsc --noEmit || echo "❌ Erreurs trouvées dans backend (Game Engine)"
	@echo "\n🔍 [Vérification] Analyse du dossier Frontend..."
	@cd src/frontend && npx tsc --noEmit || echo "❌ Erreurs trouvées dans le Frontend"
	@echo "\n✨ [Vérification] Scan terminé !"

install-local:
	@echo "[+] Installation locale des dépendances pour chaque microservice..."
	@for dir in \
		src/backend-auth \
		src/backend-friends \
		src/backend-game \
		src/backend-matchmaking \
		src/backend-status \
		src/frontend; \
		do \
		echo "📦 Installation dans $$dir..."; \
		(cd $$dir && npm install); \
	done
	@echo "[+] Génération du client Prisma local pour l'autocomplétion..."
	@cd src/backend-auth && npx prisma generate
	@echo "✨ Toutes les dépendances locales sont installées !"

npm-audit:
	@echo "[+] Audit npm pour chaque microservice..."
	@for dir in \
		src/backend-auth \
		src/backend-friends \
		src/backend-game \
		src/backend-matchmaking \
		src/backend-status \
		src/frontend; \
		do \
		echo "📦 Audit de $$dir..."; \
		(cd $$dir && npm audit); \
	done
	@echo "✨ Audits réalisés !"
