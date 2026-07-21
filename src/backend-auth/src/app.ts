import express, { NextFunction, Request, Response } from "express";
import path from "path";
import multer from "multer";
import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from "prom-client";
import { register, login } from "./controllers/authController";
import userRoutes from "./routes/userRoutes";
import prisma from "./prisma";

const app = express();
app.use(express.json());

const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: "auth_" });

const httpRequestsTotal = new Counter({
  name: "auth_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "auth_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const route = req.route?.path || req.path;
    const statusCode = String(res.statusCode);
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
    httpRequestDuration.observe({ method: req.method, route, status_code: statusCode }, durationSeconds);
  });
  next();
});

app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});

function formatUptime(totalSeconds: number): string
{
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes.toString().padStart(2, "0")}m`;
}

// Point d'entrée Santé
app.get("/health", async (_req: Request, res: Response) => {
  const uptime = formatUptime(process.uptime());

  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: "ok",
      database: "connected",
      uptime,
    });
  } catch (error) {
    console.error("[health] Database check failed:", error);
    return res.status(503).json({
      status: "degraded",
      database: "disconnected",
      uptime,
    });
  }
});

// Routes d'authentification pures
app.post("/auth/register", register);
app.post("/auth/login", login);

// Routes de gestion du profil utilisateur (identité, avatar)
app.use("/auth", userRoutes);
app.use(
  "/auth/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);

// Gestion propre des erreurs d'upload (type/taille de fichier invalide)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError || err?.message?.includes("non autorisé")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "SERVER_ERROR" });
});

const PORT = process.env.PORT; // Il écoutera sur le port 3000 dans son conteneur
app.listen(PORT, () => {
  console.log(`🔐 Microservice Auth connecté sur le port ${PORT}`);
});