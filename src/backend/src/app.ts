import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import http from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const prisma = new PrismaClient();

// Middlewares globaux
app.use(express.json());


/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Route test DB
 */
app.get('/test-db', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error('Erreur Prisma :', err);
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    res.status(500).json({ error: message });
  }
});

/**
 * Routes d'authentification
 */
app.use('/auth', authRoutes);

/**
 * 2. POSITIONNEMENT CORRECT : Le middleware de gestion d'erreurs doit être ICI, à la toute fin
 */
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error('Erreur serveur :', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

/**
 * Démarrage serveur
 */
// Envelopper l'app dans un vrai serveur HTTP
const server = http.createServer(app);

// Greffer serveur WebSocket sur ce serverur a l'adresse /ws
const wss = new WebSocketServer({ server, path: '/ws' });

// Gerer connexion client
wss.on('connection', (socket) => 
{
  console.log('Un client est connecte au WebSocket') //client connecte
  socket.on('message', (data) => //Process reception message
  {
    const message = data.toString();
    console.log('Recu :', message);
    socket.send(`Echo du serveur : ${message}`);
  });

  socket.on('close', () => //Process deconnection client
  {
    console.log('Un client s\'est deconnecte');
  });
});

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

/**
 * Shutdown propre (Production & Développement)
 */
const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));