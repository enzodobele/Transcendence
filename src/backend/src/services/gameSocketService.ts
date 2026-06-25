import { WebSocketServer, WebSocket } from 'ws';
import { Chess, Move } from 'chess.js';
import http from 'http';
import prisma from '../prisma';
import { verifyToken } from './jwtService';

interface Room {
  gameId: number;
  players: { [userId: number]: WebSocket };
  game: Chess;
}

const activeRooms = new Map<number, Room>();

export const initGameWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (socket, req) => {
    // 1. Extraction et Validation des paramètres
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const gameIdParam = url.searchParams.get('gameId');

    const validation = await handleAuthAndValidation(socket, token, gameIdParam);
    if (!validation) return; // Si null, la socket a été fermée avec une erreur explicite

    const { userId, gameId, dbGame } = validation;

    // 2. Gestion de la connexion au salon (Room RAM)
    const room = handleGameConnection(socket, gameId, userId, dbGame);

    // 3. Écouteur des messages (Coups)
    socket.on('message', async (data) => {
      await handlePlayerMove(socket, data, userId, gameId, room, dbGame);
    });

    // 4. Nettoyage à la déconnexion
    socket.on('close', () => {
      if (room && room.players[userId]) {
        delete room.players[userId];
      }
    });
  });
};

// =========================================================================
// 🛠️ FONCTIONS UTILITAIRES (DÉCOUPAGE)
// =========================================================================

/**
 * Gère l'authentification JWT et vérifie si le joueur a le droit de rejoindre la game
 */
async function handleAuthAndValidation(socket: WebSocket, token: string | null, gameIdParam: string | null) {
  if (!token || !gameIdParam) {
    socket.close(1008, "Token ou gameId manquant");
    return null;
  }

  const gameId = parseInt(gameIdParam, 10);
  
  // Authentification JWT
  try {
    const payload = verifyToken(token);
    if (!payload) throw new Error();
    
    // Vérification de la légitimité en BDD
    const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
    if (!dbGame || dbGame.status !== 'en_cours') {
      socket.close(4004, "Partie introuvable ou terminée");
      return null;
    }
    if (dbGame.player1Id !== payload.userId && dbGame.player2Id !== payload.userId) {
      socket.close(1008, "Tu ne fais pas partie de cette game");
      return null;
    }

    return { userId: payload.userId, gameId, dbGame };
  } catch {
    socket.close(1008, "Accès refusé / Token invalide");
    return null;
  }
}

/**
 * Ajoute le joueur dans la Room en RAM et envoie la synchronisation d'état
 */
function handleGameConnection(socket: WebSocket, gameId: number, userId: number, dbGame: any): Room {
  let room = activeRooms.get(gameId);
  
  if (!room) {
    room = {
      gameId,
      players: {},
      game: new Chess(dbGame.fenString)
    };
    activeRooms.set(gameId, room);
  }

  room.players[userId] = socket;
  const color = userId === dbGame.player1Id ? 'white' : 'black';
  
  // Envoi de la FEN actuelle au joueur qui vient de se connecter
  socket.send(JSON.stringify({ type: 'sync', color, fen: room.game.fen() }));

  // Notifie l'adversaire s'il est présent
  const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
  if (room.players[opponentId]) {
    room.players[opponentId].send(JSON.stringify({ type: 'opponent_connected' }));
  }

  return room;
}

/**
 * Valide le coup, le diffuse instantanément, puis lance la sauvegarde Prisma
 */
async function handlePlayerMove(socket: WebSocket, data: any, userId: number, gameId: number, room: Room, dbGame: any) {
  try {
    const parsed = JSON.parse(data.toString());
    if (parsed.type !== 'move') return;

    const { from, to, promotion } = parsed.data;
    const currentTurn = room.game.turn();
    const expectedColor = userId === dbGame.player1Id ? 'w' : 'b';

    // Anti-triche : Vérification du tour
    if (currentTurn !== expectedColor) {
      socket.send(JSON.stringify({ type: 'error', message: "Ce n'est pas ton tour !" }));
      return;
    }

    // Validation du mouvement par le moteur d'échecs
    const moveResult = room.game.move({ from, to, promotion: promotion || 'q' });
    if (!moveResult) {
      socket.send(JSON.stringify({ type: 'error', message: "Coup illégal." }));
      return;
    }

    // Calcul du nouvel état du match
    const nextFen = room.game.fen();
    const { nextStatus, winnerId, endTime, isGameOver } = checkGameStatus(room, dbGame);

    // Diffusion immédiate (Broadcast réseau RAM)
    const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
    socket.send(JSON.stringify({ type: 'move_confirmed', move: moveResult, fen: nextFen }));
    if (room.players[opponentId]) {
      room.players[opponentId].send(JSON.stringify({ type: 'opponent_move', move: moveResult, fen: nextFen }));
    }

    // Sauvegarde en tâche de fond (BDD)
    saveMoveToDatabase(gameId, userId, room, moveResult, nextFen, nextStatus, endTime, winnerId, isGameOver, dbGame);

  } catch (error) {
    socket.send(JSON.stringify({ type: 'error', message: "Format ou traitement de message invalide" }));
  }
}

/**
 * Calcule l'état de fin de partie
 */
function checkGameStatus(room: Room, dbGame: any) {
  const isGameOver = room.game.isGameOver();
  let nextStatus = 'en_cours';
  let winnerId: number | null = null;
  let endTime: Date | null = null;

  if (isGameOver) {
    endTime = new Date();
    if (room.game.isCheckmate()) {
      nextStatus = 'terminee';
      winnerId = room.game.turn() === 'b' ? dbGame.player1Id : dbGame.player2Id;
    } else {
      nextStatus = 'nulle';
    }
  }

  return { nextStatus, winnerId, endTime, isGameOver };
}

/**
 * Exécute la transaction Prisma de manière asynchrone
 */
function saveMoveToDatabase(
  gameId: number, userId: number, room: Room, moveResult: Move, 
  nextFen: string, nextStatus: string, endTime: Date | null, winnerId: number | null, 
  isGameOver: boolean, dbGame: any
) {
  prisma.$transaction([
    prisma.move.create({
      data: {
        gameId,
        playerId: userId,
        moveNumber: room.game.history().length,
        fromSquare: moveResult.from,
        toSquare: moveResult.to,
        piece: moveResult.piece.toUpperCase(),
        isCheck: room.game.inCheck(),
        isCheckmate: room.game.isCheckmate(),
        isCastle: moveResult.flags.includes('k') || moveResult.flags.includes('q'),
        isEnPassant: moveResult.flags.includes('e'),
        promotionPiece: moveResult.promotion ? moveResult.promotion.toUpperCase() : null,
      }
    }),
    prisma.game.update({
      where: { id: gameId },
      data: { fenString: nextFen, status: nextStatus, endTime, winnerId }
    }),
    ...(isGameOver ? [
      prisma.user.update({ where: { id: dbGame.player1Id }, data: { currentGameId: null } }),
      prisma.user.update({ where: { id: dbGame.player2Id }, data: { currentGameId: null } })
    ] : [])
  ]).catch(err => console.error("[-] Erreur critique lors de l'enregistrement Prisma :", err));
}