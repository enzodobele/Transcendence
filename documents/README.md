# Transcendence

structure typique backend

backend/
├── src/
│   ├── controllers/       # Logique métier (ex: authController.ts)
│   ├── services/          # Fonctions réutilisables (ex: authService.ts, jwtService.ts)
│   ├── middlewares/       # Middlewares (ex: authMiddleware.ts)
│   ├── routes/            # Définition des routes (ex: authRoutes.ts)
│   ├── prisma/            # Schéma et client Prisma
│   └── app.ts             # Configuration Express (middlewares globaux, routes)
└── Dockerfile



