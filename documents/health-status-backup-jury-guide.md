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

### Documentation
- `documents/backup-restore.md`
  - procédures backup, cron, restore, validation post-restore

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

## 3) Démo orale jury (script prêt à l'emploi)

Durée cible: 2 à 4 minutes.

### Étape A - Contexte (20s)
Dire:
- "J'ai implémenté une brique DevOps légère: health check applicatif, page de statut temps réel, backup quotidien et procédure de restauration."

### Étape B - Health check backend (30s)
Montrer:
- Ouvrir `/api/status/health` (ou curl)

Dire:
- "Cet endpoint vérifie que le service auth répond et que la DB est accessible."
- "Il renvoie un JSON standard avec `status`, `database` et `uptime`."

### Étape C - Status page (45s)
Montrer:
- Ouvrir `/status`
- Montrer les indicateurs Backend / Database / WebSocket / Last backup
- Cliquer sur `Refresh`

Dire:
- "Cette page permet de diagnostiquer rapidement l'état plateforme sans lire les logs."
- "On distingue un backend `degraded` d'un backend `offline`, ce qui est plus professionnel côté exploitation."

### Étape D - Backup (45s)
Montrer en terminal:

```bash
make backup
```

Puis:
- Montrer le dossier `backups/`
- Montrer que `src/nginx/html/backup-status.json` est mis à jour
- Rafraîchir `/status` et montrer la nouvelle date de Last backup

Dire:
- "Le backup est compressé et historisé, avec rétention."

### Étape E - Cron (20s)
Montrer la ligne prévue:

```cron
0 3 * * * /home/arthu/tronc_commun/Cercle_6/Transcendence/scripts/backup.sh >> /var/log/chessguard-backup.log 2>&1
```

Dire:
- "La sauvegarde est automatisée tous les jours à 03:00."

### Étape F - Restore documenté (30s)
Montrer:
- `documents/backup-restore.md`
- commande:

```bash
make restore FILE=backups/<dump.sql.gz>
```

Dire:
- "La procédure de reprise est documentée, testable, et réutilisable par l'équipe."

## 4) Message final conseillé au jury (10s)
Dire:
- "Cette feature apporte observabilité, résilience et reprise après incident, avec une implémentation simple et maintenable."

## 5) Commandes utiles

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
