# =============================================
# 🎮 ChessGuard Makefile
# =============================================

NAME = chessguard

DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

COMPOSE = $(DOCKER_COMPOSE) -f docker-compose.yml -p $(NAME)

# Variables
SERVICE ?=  # Si non spécifié, gère tous les services

.PHONY: up down build rebuild logs ps clean fclean \
	db-push db-studio db-seed db-migrate shell-back shell-front

# =============================================
# 🚀 APPLICATION
# =============================================

up:
	@$(COMPOSE) up -d --build $(SERVICE) 

down:
	@$(COMPOSE) down $(SERVICE) -v

# si changements dans Docker ou Dockerfile, sinon pas besoin de rebuild
rebuild: down
	@$(COMPOSE) up -d --build $(SERVICE)

# si changement de config/.env. Pour les sources de backend et frontend, c'est géré par node.
restart: down up


logs:
	@$(COMPOSE) logs -f $(SERVICE)

ps:
	@$(COMPOSE) ps --format 'table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}'

exec:
	@$(COMPOSE) exec $(SERVICE) sh

db-seed:
	@$(COMPOSE) exec backend npm run db:seed

db-migrate:
	@DB_USER=$$(cat src/secrets/db_user.txt) \
	DB_PASSWORD=$$(cat src/secrets/db_password.txt) \
	DB_NAME=$$(cat src/secrets/db_name.txt) \
	docker exec -it \
	-e DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/$$DB_NAME?schema=public" \
	-e SHADOW_DATABASE_URL="postgresql://$$DB_USER:$$DB_PASSWORD@db:5432/shadow_db?schema=public" \
	backend npx prisma migrate dev

# =============================================
# 🧹 CLEAN
# =============================================

clean:
	@$(COMPOSE) down -v

fclean:
	@$(COMPOSE) down -v --rmi all --remove-orphans