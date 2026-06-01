# =============================================
# 🎮 ChessGuard Makefile
# =============================================

NAME = chessguard

DOCKER_COMPOSE := $(shell command -v docker-compose 2>/dev/null || echo "docker compose")

COMPOSE = $(DOCKER_COMPOSE) -f docker-compose.yml -p $(NAME)

# Variables
SERVICE ?=  # Si non spécifié, gère tous les services

.PHONY: up down build rebuild logs ps clean fclean \
        db-push db-studio db-migrate shell-back shell-front

# =============================================
# 🚀 APPLICATION
# =============================================

up:
	@$(COMPOSE) up -d $(SERVICE)

down:
	@$(COMPOSE) down $(SERVICE)

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

# =============================================
# 🧹 CLEAN
# =============================================

clean:
	@$(COMPOSE) down -v

fclean:
	@$(COMPOSE) down -v --rmi all --remove-orphans