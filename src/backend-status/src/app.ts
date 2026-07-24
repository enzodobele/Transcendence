import express, { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import * as fs from "fs";
import cron from "node-cron";
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import { runBackup, runRestore, listBackups, BACKUP_STATUS_FILE } from "./backup";


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


// Express

const app = express();
app.use(express.json());

const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: "status_" });

const httpRequestsTotal = new Counter({
  name: "status_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "status_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

app.use((req: Request, res: Response, next: NextFunction) =>
{
  const start = process.hrtime.bigint();
  res.on("finish", () =>
  {
    const route = req.route?.path || req.path;
    const statusCode = String(res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);
  });
  next();
});

app.get("/metrics", async (_req: Request, res: Response) =>
{
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

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

// Admin — list restorable backups
app.get("/backups", requireAdmin, (_req: Request, res: Response) => {
  res.json({ backups: listBackups() });
});

// Admin — restore (destructive: requires confirm === true)
app.post("/restore", requireAdmin, (req: Request, res: Response) => {
  const { file, confirm } = req.body ?? {};
  if (confirm !== true) {
    res.status(400).json({ error: "Restore requires confirm: true" });
    return;
  }
  if (typeof file !== "string" || !file) {
    res.status(400).json({ error: "Missing 'file'" });
    return;
  }
  try {
    runRestore(file);
    res.json({ success: true, message: `Restauré depuis ${file}` });
  } catch (err: any) {
    console.error("[restore] Erreur :", err.message);
    res.status(400).json({ error: "Restore échoué", details: err.message });
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
