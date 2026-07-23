// src/backend/src/app.ts
import express, { Request, Response, NextFunction } from "express";
import http from "http";
import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import prisma from "./prisma";
import lobbyRoutes from "./routes/lobbyRoutes";
import { authenticate } from "./middlewares/authMiddleware";
import { initGameWebSocket } from "./services/game/gameSocketService"; // Import de notre nouveau service

// Initialisation Express
const app = express();
const server = http.createServer(app);

// --- Middlewares ---
app.use(express.json());

const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry, prefix: "game_" });

const httpRequestsTotal = new Counter({
  name: "game_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [metricsRegistry],
});

const httpRequestDuration = new Histogram({
  name: "game_http_request_duration_seconds",
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

// --- Health Check ---
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// --- Routes ---
app.use("/lobby", authenticate, lobbyRoutes);

// --- Activation du Serveur WebSocket ---
initGameWebSocket(server);

// --- Middleware d'erreurs ---
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error("Erreur serveur :", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// --- Route Internes (Microservices) ---
// Cet endpoint sera appelé uniquement par ton conteneur Matchmaking
app.post("/internal/games", async (req: Request, res: Response) => {
  const { player1Id, player2Id } = req.body;
  const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  if (!player1Id || !player2Id) {
    return res.status(400).json({ error: "Identifiants des joueurs manquants." });
  }

  try {
    const game = await prisma.$transaction(async (tx) => {
      // 1. Crée la partie en cours
      const newGame = await tx.game.create({
        data: {
          player1Id,
          player2Id,
          fenString: INITIAL_FEN,
          status: "en_cours",
        },
      });

      // 2. Assigne le currentGameId aux deux joueurs
      await tx.user.update({ where: { id: player1Id }, data: { currentGameId: newGame.id } });
      await tx.user.update({ where: { id: player2Id }, data: { currentGameId: newGame.id } });

      return newGame;
    });

    // Récupération des pseudos pour le Frontend
    const p1 = await prisma.user.findUnique({ where: { id: player1Id }, select: { username: true } });
    const p2 = await prisma.user.findUnique({ where: { id: player2Id }, select: { username: true } });

    return res.status(201).json({
      message: "Partie créée",
      gameId: game.id,
      fenString: INITIAL_FEN,
      currentGame: {
        id: game.id,
        status: game.status,
        player1: { username: p1?.username || "" },
        player2: { username: p2?.username || "" },
      },
    });
  } catch (error) {
    console.error("Erreur création partie interne:", error);
    return res.status(500).json({ error: "Erreur lors de l'initialisation du match" });
  }
});

// --- Démarrage du serveur ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  try {
    await prisma.$connect();
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

// --- Shutdown propre ---
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
