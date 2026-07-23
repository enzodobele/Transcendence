import express, { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import cron from "node-cron";


// Configuration secrets

function readSecretFile(envVar: string): string
{
  const filePath = process.env[envVar];
  if (!filePath)
  {
    console.error(`❌ CRITICAL: ${envVar} non défini`);
    process.exit(1);
  }
  const value = fs.readFileSync(filePath, "utf8").trim();
  if (!value)
  {
    console.error(`❌ CRITICAL: fichier ${envVar} vide`);
    process.exit(1);
  }
  return value;
}

const JWT_SECRET = readSecretFile("JWT_SECRET_FILE");
const DB_USER = readSecretFile("DB_USER_FILE");
const DB_PASSWORD = readSecretFile("DB_PASSWORD_FILE");
const DB_NAME = readSecretFile("DB_NAME_FILE");
const DB_HOST = "db";

const BACKUP_DIR = "/backups";
const BACKUP_STATUS_FILE = path.join(BACKUP_DIR, "backup-status.json");
const MAX_BACKUPS = 7;


// Services surveillés

const SERVICES = [
  { name: "auth",        url: "http://backend-auth:3000/health" },
  { name: "game",        url: "http://backend-game:3002/health" },
  { name: "matchmaking", url: "http://backend-matchmaking:3001/health" },
  { name: "friends",     url: "http://backend-friends:3003/health" },
  { name: "ai",          url: "http://ai:8000/health" },
];


// Middleware admin

function requireAdmin(req: Request, res: Response, next: NextFunction): void
{
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
  {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  try
  {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!payload.isAdmin)
    {
      res.status(403).json({ error: "Forbidden: admin uniquement" });
      return;
    }
    next();
  }
  catch
  {
    res.status(401).json({ error: "Token invalide" });
  }
}


// Backup

function runBackup(): void
{
  if (!fs.existsSync(BACKUP_DIR))
    fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "");
  const filename = `chessguard_${ts}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  execSync(
    `pg_dump -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} | gzip > ${filepath}`,
    { env: { ...process.env, PGPASSWORD: DB_PASSWORD } },
  );

  fs.writeFileSync(
    BACKUP_STATUS_FILE,
    JSON.stringify({ lastBackup: now.toISOString(), file: filename }, null, 2),
  );

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".sql.gz"))
    .sort();
  while (files.length > MAX_BACKUPS)
    fs.unlinkSync(path.join(BACKUP_DIR, files.shift()!));

  console.log(`[backup] Terminé : ${filename}`);
}


// Express

const app = express();
app.use(express.json());

// Public — Docker healthcheck
app.get("/health", (_req: Request, res: Response) =>
{
  res.json({ status: "ok" });
});

// Admin — statut de tous les microservices
app.get("/services", requireAdmin, async (_req: Request, res: Response) =>
{
  const results = await Promise.all(
    SERVICES.map(async ({ name, url }) =>
    {
      try
      {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const r = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        const data = await r.json().catch(() => ({}));
        return { name, ...data, status: r.ok ? "online" : "degraded" };
      }
      catch
      {
        return { name, status: "offline" };
      }
    }),
  );
  res.json(results);
});

// Admin — statut du dernier backup
app.get("/backup", requireAdmin, (_req: Request, res: Response) =>
{
  try
  {
    if (!fs.existsSync(BACKUP_STATUS_FILE))
    {
      res.json({ lastBackup: null });
      return;
    }
    res.json(JSON.parse(fs.readFileSync(BACKUP_STATUS_FILE, "utf8")));
  }
  catch
  {
    res.status(500).json({ error: "Impossible de lire le statut du backup" });
  }
});

// Admin — déclenchement manuel d'un backup
app.post("/backup", requireAdmin, (_req: Request, res: Response) =>
{
  try
  {
    runBackup();
    res.json({ success: true, message: "Backup effectué avec succès" });
  }
  catch (err: any)
  {
    console.error("[backup] Erreur :", err.message);
    res.status(500).json({ error: "Backup échoué", details: err.message });
  }
});


// Cron : backup automatique à 03h00

cron.schedule("0 3 * * *", () =>
{
  console.log("[cron] Démarrage du backup planifié...");
  try
  {
    runBackup();
  }
  catch (err: any)
  {
    console.error("[cron] Backup échoué :", err.message);
  }
});

const PORT = process.env.PORT ?? 3004;
app.listen(PORT, () =>
{
  console.log(`Status service démarré sur le port ${PORT}`);
});
