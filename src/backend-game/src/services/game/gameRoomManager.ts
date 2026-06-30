// src/backend/src/services/game/gameRoomManager.ts
import { Chess } from "chess.js";
import { WebSocket } from "ws";
import { Room } from "./types";

// La Map reste encapsulée dans ce module
const activeRooms = new Map<number, Room>();

/**
 * Initialise ou récupère une Room en RAM, en reconstituant l'historique si nécessaire
 */
export function handleGameConnection(
  socket: WebSocket,
  gameId: number,
  userId: number,
  dbGame: any,
): Room {
  let room = activeRooms.get(gameId);

  if (!room) {
    room = {
      gameId,
      players: {},
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

  // Ajout du joueur actif
  room.players[userId] = socket;
  return room;
}

/**
 * Supprime un joueur de la room à la déconnexion
 */
export function removePlayerFromRoom(gameId: number, userId: number): void {
  const room = activeRooms.get(gameId);
  if (room && room.players[userId]) {
    delete room.players[userId];
    // Optionnel : Si room.players est vide, tu pourrais activeRooms.delete(gameId) pour libérer la RAM
  }
}

/**
 * Calcule l'état de fin de partie via le moteur chess.js
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
