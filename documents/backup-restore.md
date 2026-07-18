# Backup and Restore

## Backup script

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

## Automatic backup (cron)

Example daily backup at 03:00:

```cron
0 3 * * * /home/arthu/tronc_commun/Cercle_6/Transcendence/scripts/backup.sh >> /var/log/chessguard-backup.log 2>&1
```

## Restore script

The project includes [scripts/restore.sh](../scripts/restore.sh).

Run restore:

```bash
make restore FILE=backups/<your_dump.sql.gz>
```

## Disaster recovery procedure (simple)

1. Stop write-heavy traffic to the app.
2. Ensure the DB container is running.
3. Run restore command with the selected backup.
4. Restart application services.
5. Validate:
   - `/api/status/health` returns `status: ok` and `database: connected`
   - `/status` shows Backend/Database/WebSocket online
