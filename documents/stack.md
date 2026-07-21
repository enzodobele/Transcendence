# Stack

Frameworks utilisés dans l'application :

- React avec Vite pour l'interface SPA, le rendu des vues de jeu et le build frontend.
- Express pour les microservices Node.js, avec les routes HTTP, l'authentification et le WebSocket du jeu.
- Prisma pour l'accès à la base de données, les migrations et la persistance des utilisateurs, parties et états liés au jeu.
- FastAPI pour le service IA, exposé via des endpoints simples comme `/predict` et `/health`.
- Uvicorn pour exécuter le service Python FastAPI dans le conteneur dédié.

