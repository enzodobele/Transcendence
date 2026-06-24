import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Chess } from 'chess.js';
import prisma from './prisma';
import authRoutes from './routes/authRoutes';
import lobbyRoutes from './routes/lobbyRoutes';
import { authenticate } from './middlewares/authMiddleware';
import { verifyToken } from './services/jwtService';

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

// --- WebSocket Server ---
const wss = new WebSocketServer({ server, path: '/ws' });

// Types pour les rooms WebSocket
interface Room {
  id: number;
  players: WebSocket[];
  game: Chess;
  gameId?: number;
  player1Id?: number;
  player2Id?: number;
}

let rooms: Room[] = [];
let nextRoomId = 1;

// Gestion des connexions WebSocket
wss.on('connection', (socket, req) => {
  // Récupère le token JWT depuis l'URL
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    socket.close(1008, "Token manquant");
    return;
  }

  // Vérifie le token et récupère userId
  let userId: number;
  try {
    const payload = verifyToken(token);
    if (!payload) {
      throw new Error('Token invalide');
    }

    userId = payload.userId;
  } catch {
    socket.close(1008, "Token invalide");
    return;
  }

  // Stocke userId dans la socket
  (socket as any).userId = userId;

  // Trouve ou crée une room
  let room = rooms.find((r) => r.players.length < 2);
  if (!room) {
    room = { id: nextRoomId++, players: [], game: new Chess() };
    rooms.push(room);
  }

  room.players.push(socket);
  const color = room.players.length === 1 ? 'white' : 'black';
  console.log(`Un joueur (ID: ${userId}) a rejoint la room ${room.id} (${color})`);

  // Si c'est le premier joueur, il attend
  if (room.players.length === 1) {
    socket.send(JSON.stringify({ type: 'waiting', color }));
  }
  // Si la room est complète, démarre la partie
  else {
    const player1Id = (room.players[0] as any).userId;
    const player2Id = (room.players[1] as any).userId;

    // Crée la partie en base de données
    prisma.game.create({
      data: {
        player1Id,
        player2Id,
        timeControl: "5+0",
        fenString: room.game.fen(),
        status: "en_cours",
      },
    }).then((game) => {
      room.gameId = game.id;
      room.player1Id = player1Id;
      room.player2Id = player2Id;

      room.players.forEach((player, index) => {
        const playerColor = index === 0 ? 'white' : 'black';
        player.send(JSON.stringify({
          type: 'start',
          color: playerColor,
          gameId: game.id,
        }));
      });
    }).catch((err) => {
      console.error("Erreur lors de la création de la partie:", err);
      room.players.forEach((player) => {
        player.send(JSON.stringify({ type: 'error', message: "Erreur lors de la création de la partie" }));
      });
    });
  }

  // Gestion des messages WebSocket (moves)
  socket.on('message', async (data) => {
    // ... (le reste de ton code WebSocket existant)
  });

  // Gestion de la fermeture de connexion
  socket.on('close', async () => {
    // ... (le reste de ton code WebSocket existant)
  });
});

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
      console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
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
  wss.clients.forEach((client) => {
    if (!client.CLOSED) {
      client.close(1001, 'Server is shutting down');
    }
  });
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));