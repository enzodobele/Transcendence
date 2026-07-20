# Health Check + Status Page + Backup

Ce document récapitule exactement ce qui a été modifié pour la feature:
- endpoint santé
- page de statut
- backup automatique + restauration

## 1) Fichiers modifiés pour cette feature

### Backend (Health API)
- `src/backend-auth/src/app.ts`
  - Ajout/extension de `GET /health`
  - Vérification DB (`SELECT 1`)
  - Retour JSON avec:
    - `status`
    - `database`
    - `uptime`

### Frontend (Status page)
- `src/frontend/src/main.tsx`
  - Routage simple vers `/status`
- `src/frontend/src/components/StatusPage.tsx`
  - Page visuelle de statut
  - Affiche Backend / Database / WebSocket / Last backup / Last check
- `src/frontend/src/services/status.ts`
  - Appels API:
    - `/api/status/health`
    - `/api/status/ws`
    - `/backup-status.json`
  - Agrégation du statut global pour l'UI
- `src/frontend/src/styles/status.css`
  - Styles visuels de la page status

### Nginx (Exposition des endpoints)
- `src/nginx/nginx.conf` (dev)
  - `location = /api/status/health` -> `backend-auth:3000/health`
  - `location = /api/status/ws` -> `backend-game:3002/health`
  - `location = /backup-status.json` -> fichier statique
- `src/nginx/nginx.prod.conf` (prod)
  - mêmes routes status que dev

### Backup / Restore (DevOps)
- `scripts/backup.sh`
  - dump PostgreSQL (`pg_dump` via conteneur DB)
  - compression en `.sql.gz`
  - MAJ de `backup-status.json`
  - politique de rétention (7 backups)
- `scripts/restore.sh`
  - restauration depuis `.sql` ou `.sql.gz`
- `src/nginx/html/backup-status.json`
  - statut du dernier backup lu par la page `/status`
- `Makefile`
  - cible `backup`
  - cible `restore FILE=...`


## 2) Ce que la feature affiche concrètement

Endpoint backend:
- `GET /health` renvoie par exemple:

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": "12h32m"
}
```

Page `/status`:
- Backend: `Online` / `Degraded` / `Offline`
- Database: `Online` / `Offline`
- WebSocket: `Online` / `Offline`
- Last backup: date ISO du dernier backup
- Last check: date/heure du dernier refresh


## 3) Backup and Restore

### Backup script

The project now includes [scripts/backup.sh](../scripts/backup.sh).

What it does:
- creates a PostgreSQL dump from the running DB container
- compresses it as `.sql.gz` in `backups/`
- updates `src/nginx/html/backup-status.json` (read by the `/status` page)
- keeps only the latest 7 backups

Run manually:

```bash
make backup
```

### Automatic backup (cron)

Example daily backup at 03:00:

```cron
0 3 * * * /home/arthu/tronc_commun/Cercle_6/Transcendence/scripts/backup.sh >> /var/log/chessguard-backup.log 2>&1
```

### Restore script

The project includes [scripts/restore.sh](../scripts/restore.sh).

Run restore:

```bash
make restore FILE=backups/<your_dump.sql.gz>
```

### Disaster recovery procedure (simple)

1. Stop write-heavy traffic to the app.
2. Ensure the DB container is running.
3. Run restore command with the selected backup.
4. Restart application services.
5. Validate:
   - `/api/status/health` returns `status: ok` and `database: connected`
   - `/status` shows Backend/Database/WebSocket online




## 4) Commandes utiles

```bash
# Lancer un backup manuel
make backup

# Restaurer un backup
make restore FILE=backups/<nom_du_dump.sql.gz>

# Vérifier la santé backend auth
curl -sk https://localhost/api/status/health

# Vérifier le statut game/ws
curl -sk https://localhost/api/status/ws
```

