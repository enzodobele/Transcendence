# Health Check + Status Page + Backup

- endpoint santé
- page de statut (admin only)
- backup automatique + restauration

## 1 Fichiers modifiés pour cette feature

### Backend Status (nouveau microservice)
- `src/backend-status/src/app.ts`
  - `GET /health` — public (Docker healthcheck)
  - `GET /services` — admin only, agrège le `/health` de chaque service
  - `GET /backup` — admin only, retourne le statut du dernier backup
  - `POST /backup` — admin only, déclenche un backup manuel
  - Cron interne : backup automatique à 03h00
- `src/backend-status/Dockerfile`
- `src/backend-status/package.json`

### Backend Auth (rôle admin)
- `src/backend-auth/prisma/schema.prisma`
  - Ajout `isAdmin Boolean @default(false)` sur le model `User`
- `src/backend-auth/prisma/migrations/20260720000000_add_is_admin/migration.sql`
- `src/backend-auth/src/services/authService.ts`
  - `generateToken` inclut `isAdmin` dans le payload JWT
- `src/backend-auth/src/controllers/authController.ts`
  - Passe `user.isAdmin` à `generateToken` (register + login)

### Frontend (Status page)
- `src/frontend/src/components/StatusPage.tsx`
  - Protégée : redirige si le token JWT ne contient pas `isAdmin: true`
  - Affiche le statut de chaque microservice individuellement
  - Bouton "Lancer un backup" (POST `/api/status/backup`)
- `src/frontend/src/services/status.ts`
  - `fetchServices(token)` → `GET /api/status/services`
  - `fetchBackupStatus(token)` → `GET /api/status/backup`
  - `triggerBackup(token)` → `POST /api/status/backup`
  - `isAdminToken(token)` — décode le JWT côté client

### Nginx
- `src/nginx/nginx.conf` (dev)
  - `location /api/status/` → `backend-status:3004/`
  - (remplace les anciennes routes exactes `/api/status/health` et `/api/status/ws`)
- `src/nginx/nginx.prod.conf` (prod) — à mettre à jour de la même façon

### Docker Compose
- `docker-compose.yml`
  - Nouveau service `backend-status` (port 3004, volume `./backups:/backups`)
  - `nginx` dépend de `backend-status: service_healthy`

### Restore script
- `scripts/restore.sh`
  - Reset automatique du schéma (`DROP SCHEMA public CASCADE`) avant restauration


## 2 Ce que la feature affiche concrètement

Page `/status` (admin uniquement) :
- Auth / Game Engine / Matchmaking / Friends / IA : `Online` / `Degraded` / `Offline`
- Last backup : date du dernier dump
- Bouton : Lancer un backup
- Bouton : Refresh

Si l'utilisateur n'est pas admin :
> "Accès réservé aux administrateurs."


## 3 Backup and Restore

### Backup automatique (cron interne)

Le container `backend-status` exécute un backup chaque nuit à 03h00 via `node-cron`.
Plus besoin d'installer un cron sur la machine hôte.

### Backup manuel

```bash
# Via l'interface web /status (bouton)
# ou via l'API :
curl -sk -X POST https://localhost/api/status/backup \
  -H "Authorization: Bearer <token_admin>"

# Via le Makefile (script shell hôte) :
make backup
```

### Restore script

```bash
make restore FILE=backups/<nom_du_dump.sql.gz>
```

### Donner le rôle admin à un utilisateur

```sql
UPDATE "users" SET "isAdmin" = true WHERE username = 'ton_username';
```

```bash
docker exec -it chessguard-db psql -U $(cat src/secrets/db_user.txt) -d $(cat src/secrets/db_name.txt) \
  -c "UPDATE \"users\" SET \"isAdmin\" = true WHERE username = 'bob';"
```

## 4 Commandes utiles

```bash
# Vérifier que backend-status répond
curl -sk https://localhost/api/status/health

# Voir le statut de tous les services (token admin requis)
curl -sk https://localhost/api/status/services \
  -H "Authorization: Bearer <token>"

# Voir le dernier backup
curl -sk https://localhost/api/status/backup \
  -H "Authorization: Bearer <token>"

# Restaurer un backup
make restore FILE=backups/<nom_du_dump.sql.gz>
```

