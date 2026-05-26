# =============================================
# 🎮 ChessGuard Makefile
# =============================================

NAME = chessguard
COMPOSE = docker compose -f docker-compose.yml -p $(NAME)

.PHONY: up down build rebuild logs ps clean fclean \
        db-push db-studio db-migrate shell-back shell-front

# =============================================
# 🚀 APPLICATION
# =============================================

up:
	@$(COMPOSE) up -d

down:
	@$(COMPOSE) down

build:
	@$(COMPOSE) build

rebuild:
	@$(COMPOSE) up -d --build

restart: down rebuild

logs:
	@$(COMPOSE) logs -f

ps:
	@$(COMPOSE) ps

# =============================================
# 🗃️ DATABASE (Prisma)
# =============================================

db-push:
	@$(COMPOSE) exec backend npx prisma db push

db-studio:
	@$(COMPOSE) exec backend npx prisma studio

db-migrate:
	@$(COMPOSE) exec backend npx prisma migrate dev

# =============================================
# 🐚 SHELLS
# =============================================

shell-back:
	@$(COMPOSE) exec backend sh

shell-front:
	@$(COMPOSE) exec frontend sh

# =============================================
# 🧹 CLEAN
# =============================================

clean:
	@$(COMPOSE) down -v

fclean:
	@$(COMPOSE) down -v --rmi all --remove-orphans