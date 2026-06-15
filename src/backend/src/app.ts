import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Chess } from 'chess.js';

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
interface Room
{
  id:       number; //Identifiant de la partie
  players:  WebSocket[]; //les sockets des deux joueurs
  game: Chess;
}

let rooms: Room[] = []; //Toutes les rooms du serveur
let nextRoomId = 1;

wss.on('connection', (socket) => 
{
  let room = rooms.find((r) => r.players.length < 2);
  if (!room)
  {
    room = { id: nextRoomId++, players: [], game: new Chess() };
    rooms.push(room);
  }

  room.players.push(socket);
  const color = room.players.length === 1 ? 'white' : 'black';
  console.log(`Un joueur a rejoint la room ${room.id} (${color})`);

  if (room.players.length === 1)
  {
    socket.send(JSON.stringify({ type: 'waiting', color }));
  }
  else
  {
    room.players.forEach((player, index) =>
    {
      const playerColor = index === 0 ? 'white' : 'black';
      player.send(JSON.stringify({ type: 'start', color: playerColor }));
    });
  }

  socket.on('message', (data) =>
  {
    let message;
    try
    {
      message = JSON.parse(data.toString());
    }
    catch
    {
      return ; //Si le message est illisible
    }

    if (message.type === 'move')
    {
      const senderColor = room.players.indexOf(socket) === 0 ? 'w' : 'b';

      if (room.game.turn() !== senderColor)
      {
        socket.send(JSON.stringify({ type: 'error', message: "Ce n'est pas ton tour" }));
        return;
      }

      let move;
      try
      {
        move = room.game.move({ from: message.from, to: message.to, promotion: 'q' });
      }
      catch
      {
        move = null;
      }

      if (!move)
      {
        socket.send(JSON.stringify({ type: 'error', message: "Coup illegal" }));
        return;
      }

      room.players.forEach((player) =>
      {
        if (player !== socket)
        {
          player.send(JSON.stringify({ type: 'opponentMove', from: message.from, to: message.to}));
        }
      });

      if (room.game.isGameOver())
      {
        let reason;
        if (room.game.isCheckmate())
            reason = 'checkmate';
        else if (room.game.isStalemate())
            reason = 'stalemate';
        else if (room.game.isDraw())
            reason = 'draw';
        else
            reason = 'over';
        
        const winner = reason === 'checkmate' ? senderColor : null;

        room.players.forEach((player) => 
        {
          player.send(JSON.stringify({ type: 'gameOver', reason, winner }));
        });
      }
    }
  })

  socket.on('close', () => 
  {
    room.players.forEach((player) => 
    {
      if (player !== socket)
      {
        player.send(JSON.stringify({ type: 'opponentLeft' }));
      }
    });
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