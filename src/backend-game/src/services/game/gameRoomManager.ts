// src/backend/src/services/game/gameRoomManager.ts
import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { Room } from "./types";

// La Map reste encapsulée dans ce module
const activeRooms = new Map<number, Room>();

/**
 * Initialise ou récupère une Room en RAM, en reconstituant l'historique si nécessaire.
 */
function getOrCreateRoom(
  gameId: number,
  dbGame: any,
): Room {
  let room = activeRooms.get(gameId);

  if (!room) {
    room = {
      gameId,
      players: {},
      spectators: new Set<WebSocket>(),
      game: new Chess(),
    };

    // Reconstitution de l'historique depuis les données de la BDD
    if (dbGame.moves && dbGame.moves.length > 0) {
      const sortedMoves = dbGame.moves.sort((a: any, b: any) => a.id - b.id);

      sortedMoves.forEach((m: any) => {
        try {
          room!.game.move({
            from: m.fromSquare,
            to: m.toSquare,
            promotion: m.promotionPiece?.toLowerCase(),
          });
        } catch (e) {
          console.error(
            `[-] Erreur reconstruction du coup (${m.fromSquare}->${m.toSquare}):`,
            e,
          );
        }
      });
    } else {
      room.game.load(dbGame.fenString);
    }

    activeRooms.set(gameId, room);
  }

  return room;
}

/**
 * Enregistre la connexion d'un joueur dans la room active correspondante.
 */
export function handleGameConnection(
  socket: WebSocket,
  gameId: number,
  userId: number,
  dbGame: any,
): Room {
  const room = getOrCreateRoom(gameId, dbGame);

  // Une connexion précédente existe déjà pour ce joueur (ex: un autre onglet) :
  // on la ferme pour n'avoir jamais qu'une seule socket active par joueur/partie.
  const existingSocket = room.players[userId];
  if (existingSocket && existingSocket !== socket && existingSocket.readyState === WebSocket.OPEN) {
    existingSocket.close(4001, "Replaced by a new connection");
  }

  // Ajout du joueur actif
  room.players[userId] = socket;
  return room;
}

/**
 * Enregistre un spectateur dans la room active correspondante.
 */
export function handleSpectatorConnection(
  socket: WebSocket,
  gameId: number,
  dbGame: any,
): Room {
  const room = getOrCreateRoom(gameId, dbGame);
  room.spectators.add(socket);
  return room;
}

/**
 * Supprime un joueur de la room à la déconnexion, uniquement si la socket qui se
 * ferme est bien celle actuellement enregistrée (sinon c'est une ancienne connexion
 * déjà remplacée par une reconnexion plus récente, ex: un autre onglet).
 * Retourne true si le joueur a effectivement été retiré.
 */
export function removePlayerFromRoom(gameId: number, userId: number, socket: WebSocket): boolean {
  const room = activeRooms.get(gameId);
  if (room && room.players[userId] === socket) {
    delete room.players[userId];
    // Optionnel : Si room.players est vide, tu pourrais activeRooms.delete(gameId) pour libérer la RAM
    return true;
  }
  return false;
}

/**
 * Retire un spectateur de la room quand sa socket se ferme.
 */
export function removeSpectatorFromRoom(gameId: number, socket: WebSocket): void {
  const room = activeRooms.get(gameId);
  if (room && room.spectators.has(socket)) {
    room.spectators.delete(socket);
  }
}

/**
 * Diffuse un message à tous les spectateurs connectés à la room.
 */
export function broadcastToSpectators(room: Room, payload: object): void {
  const message = JSON.stringify(payload);
  room.spectators.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}

/**
 * Calcule l'état de fin de partie via le moteur chess.js.
 */
export function checkGameStatus(room: Room, dbGame: any) {
  const isGameOver = room.game.isGameOver();
  let nextStatus = "en_cours";
  let winnerId: number | null = null;
  let endTime: Date | null = null;

  if (isGameOver) {
    endTime = new Date();
    if (room.game.isCheckmate()) {
      nextStatus = "terminee";
      winnerId = room.game.turn() === "b" ? dbGame.player1Id : dbGame.player2Id;
    } else {
      nextStatus = "nulle";
    }
  }

  return { nextStatus, winnerId, endTime, isGameOver };
}
