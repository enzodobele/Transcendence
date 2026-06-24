import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Chess } from 'chess.js';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import authRoutes from './routes/authRoutes';
import lobbyRoutes from './routes/lobbyRoutes';
import { authenticate } from './middlewares/authMiddleware';

const app = express();
const server = http.createServer(app);

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

// Fonction pour vérifier un token JWT (à adapter avec ton authService)
const verifyJwt = (token: string): { id: number; username: string } => {
  try {
    const secret = process.env.JWT_SECRET || 'ta_cle_secrete';
    return jwt.verify(token, secret) as { id: number; username: string };
  } catch (err) {
    throw new Error('Token invalide');
  }
};

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
    const payload = verifyJwt(token);
    userId = payload.id;
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
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (message.type === 'move') {
      const senderIndex = room.players.indexOf(socket);
      const senderColor = senderIndex === 0 ? 'w' : 'b';
      const senderId = (socket as any).userId;

      if (room.game.turn() !== senderColor) {
        socket.send(JSON.stringify({ type: 'error', message: "Ce n'est pas ton tour" }));
        return;
      }

      let move;
      try {
        move = room.game.move({
          from: message.from,
          to: message.to,
          promotion: message.promotion || 'q',
        });
      } catch {
        socket.send(JSON.stringify({ type: 'error', message: "Coup illégal" }));
        return;
      }

      // Enregistre le coup en base de données
      try {
        await prisma.move.create({
          data: {
            gameId: room.gameId!,
            playerId: senderId,
            moveNumber: room.game.history().length,
            fromSquare: message.from,
            toSquare: message.to,
            piece: room.game.get(message.from)?.type || 'P',
            isCheck: room.game.isCheck(),
            isCheckmate: room.game.isCheckmate(),
            isCastle: move.flags.includes('k') || move.flags.includes('q'),
            isEnPassant: move.flags.includes('e'),
            promotionPiece: move.promotion,
          },
        });

        // Met à jour le fenString de la partie
        await prisma.game.update({
          where: { id: room.gameId! },
          data: { fenString: room.game.fen() },
        });
      } catch (err) {
        console.error("Erreur lors de l'enregistrement du coup:", err);
        socket.send(JSON.stringify({ type: 'error', message: "Erreur lors de l'enregistrement du coup" }));
        return;
      }

      // Envoie le coup à l'adversaire
      room.players.forEach((player) => {
        if (player !== socket) {
          player.send(JSON.stringify({
            type: 'opponentMove',
            from: message.from,
            to: message.to,
            fen: room.game.fen(),
          }));
        }
      });

      // Vérifie la fin de partie
      if (room.game.isGameOver()) {
        let reason: string;
        if (room.game.isCheckmate()) reason = 'checkmate';
        else if (room.game.isStalemate()) reason = 'stalemate';
        else if (room.game.isDraw()) reason = 'draw';
        else reason = 'over';

        const winnerId = reason === 'checkmate' ?
          (senderIndex === 0 ? room.player1Id : room.player2Id) :
          null;

        try {
          await prisma.game.update({
            where: { id: room.gameId! },
            data: {
              status: reason === 'checkmate' ? 'terminee' :
                      reason === 'draw' || reason === 'stalemate' ? 'nulle' : 'abandonnee',
              endTime: new Date(),
              winnerId,
              fenString: room.game.fen(),
            },
          });

          // Met à jour les stats des joueurs
          if (winnerId) {
            await prisma.userStats.upsert({
              where: { userId: winnerId },
              create: { userId: winnerId, wins: 1, totalGames: 1 },
              update: { wins: { increment: 1 }, totalGames: { increment: 1 } },
            });
            await prisma.userStats.upsert({
              where: { userId: winnerId === room.player1Id ? room.player2Id! : room.player1Id! },
              create: {
                userId: winnerId === room.player1Id ? room.player2Id! : room.player1Id!,
                losses: 1,
                totalGames: 1,
              },
              update: { losses: { increment: 1 }, totalGames: { increment: 1 } },
            });
          } else {
            await prisma.userStats.upsert({
              where: { userId: room.player1Id! },
              create: { userId: room.player1Id!, draws: 1, totalGames: 1 },
              update: { draws: { increment: 1 }, totalGames: { increment: 1 } },
            });
            await prisma.userStats.upsert({
              where: { userId: room.player2Id! },
              create: { userId: room.player2Id!, draws: 1, totalGames: 1 },
              update: { draws: { increment: 1 }, totalGames: { increment: 1 } },
            });
          }
        } catch (err) {
          console.error("Erreur lors de la mise à jour de la partie:", err);
        }

        room.players.forEach((player) => {
          player.send(JSON.stringify({ type: 'gameOver', reason, winner: winnerId }));
        });
      }
    }
  });

  // Gestion de la fermeture de connexion
  socket.on('close', async () => {
    const index = room.players.indexOf(socket);
    if (index !== -1) {
      room.players.splice(index, 1);
    }

    if (room.gameId) {
      try {
        await prisma.game.update({
          where: { id: room.gameId },
          data: {
            status: 'abandonnee',
            endTime: new Date(),
            fenString: room.game.fen(),
          },
        });
      } catch (err) {
        console.error("Erreur lors de la mise à jour de la partie abandonnée:", err);
      }
    }

    room.players.forEach((player) => {
      if (player !== socket) {
        player.send(JSON.stringify({ type: 'opponentLeft' }));
      }
    });

    if (room.players.length === 0) {
      rooms = rooms.filter((r) => r.id !== room.id);
    }
  });
});

// --- Middlewares Express ---
app.use(express.json());

// --- Routes Express ---
app.use('/auth', authRoutes);
app.use('/lobby', authenticate, lobbyRoutes);

// --- Middleware d'erreurs ---
app.use((err: any, req: any, res: any, next: any) => {
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