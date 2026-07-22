# =========================================================================
# 🎮 ChessGuard Makefile
# =========================================================================

NAME = chessguard
# Overridable for Podman clusters: make up DOCKER_COMPOSE="podman compose"
DOCKER_COMPOSE ?= docker compose

# 📂 Fichiers de configuration Docker Compose
COMPOSE_DEV  = $(DOCKER_COMPOSE) -f docker-compose.yml -p $(NAME)_dev
COMPOSE_PROD = $(DOCKER_COMPOSE) -f docker-compose.prod.yml -p $(NAME)_prod

SERVICE ?=

.PHONY: up down rebuild restart logs ps exec db-seed db-migrate format backup restore \
        prod prod-down prod-rebuild prod-logs prod-ps prod-exec prod-db-seed \
        clean fclean prod-clean prod-fclean check-types \
        vault-status vault-unseal vault-logs prod-vault-status prod-vault-unseal prod-vault-logs \
        waf-logs waf-audit prod-waf-logs

# =========================================================================
# 🛠️ ENVIRONNEMENT DE DÉVELOPPEMENT (Local)
# =========================================================================

up:
	@mkdir -p .vault/dev
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
	@echo "[+] Running Prisma migrations (DEV)..."
	@. ./.vault/dev/init.env && \
	DB_USER=$$($(COMPOSE_DEV) exec -T -e VAULT_TOKEN="$$VAULT_ROOT_TOKEN" vault vault kv get -field=user secret/chessguard/db) && \
	DB_PASSWORD=$$($(COMPOSE_DEV) exec -T -e VAULT_TOKEN="$$VAULT_ROOT_TOKEN" vault vault kv get -field=password secret/chessguard/db) && \
	DB_NAME=$$($(COMPOSE_DEV) exec -T -e VAULT_TOKEN="$$VAULT_ROOT_TOKEN" vault vault kv get -field=name secret/chessguard/db) && \
	$(COMPOSE_DEV) exec \
	-e DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/$$DB_NAME?schema=public" \
	-e SHADOW_DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/shadow_db?schema=public" \
	backend-auth npx prisma migrate dev

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

prod:
	@mkdir -p .vault/prod
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
# 🔐 VAULT OPERATIONS
# =========================================================================

vault-status:
	@$(COMPOSE_DEV) exec vault vault status

vault-unseal:
	@. ./.vault/dev/init.env && \
	$(COMPOSE_DEV) exec -T vault vault operator unseal "$$VAULT_UNSEAL_KEY"

vault-logs:
	@$(COMPOSE_DEV) logs -f vault vault-bootstrap

prod-vault-status:
	@$(COMPOSE_PROD) exec vault vault status

prod-vault-unseal:
	@. ./.vault/prod/init.env && \
	$(COMPOSE_PROD) exec -T vault vault operator unseal "$$VAULT_UNSEAL_KEY"

prod-vault-logs:
	@$(COMPOSE_PROD) logs -f vault vault-bootstrap

# =========================================================================
# 🛡️ WAF (ModSecurity audit log)
# =========================================================================

# Follow the ModSecurity audit log (one JSON record per matched request).
waf-logs:
	@$(COMPOSE_DEV) exec nginx tail -f /var/log/modsecurity/audit.log

# Summary of the CRS rules that fired most
waf-audit:
	@$(COMPOSE_DEV) exec nginx sh -c 'grep -oE "\"ruleId\":\"[0-9]+\"" /var/log/modsecurity/audit.log | sort | uniq -c | sort -rn | head -20'

prod-waf-logs:
	@$(COMPOSE_PROD) exec nginx tail -f /var/log/modsecurity/audit.log

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
	@rm -rf .vault/prod

hclean:
	@echo "🚨 Arrêt des conteneurs et suppression des volumes de DEV..."
	@$(COMPOSE_DEV) down -v --remove-orphans
	@rm -rf .vault/dev

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
	@rm -rf .vault/prod

prod-hclean:
	@echo "[!] ⚠️ DANGER : Purge complète de la PRODUCTION dans 5 secondes..."
	@sleep 5
	@echo "🚨 Arrêt des conteneurs et suppression des volumes de PRODUCTION..."
	@$(COMPOSE_PROD) down -v --remove-orphans
	@rm -rf .vault/prod

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
