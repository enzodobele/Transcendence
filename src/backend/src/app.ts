import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import prisma from './prisma';
import authRoutes from './routes/authRoutes';
import lobbyRoutes from './routes/lobbyRoutes';
import { authenticate } from './middlewares/authMiddleware';
import { initGameWebSocket } from './services/gameSocketService'; // Import de notre nouveau service

// Initialisation Express
const app = express();
const server = http.createServer(app);

// --- Middlewares ---
app.use(express.json());

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/lobby', authenticate, lobbyRoutes);

// --- Activation du Serveur WebSocket ---
initGameWebSocket(server); // Une seule ligne, propre !

// --- Middleware d'erreurs ---
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- Démarrage du serveur ---
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  try {
    await prisma.$connect();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
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

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));