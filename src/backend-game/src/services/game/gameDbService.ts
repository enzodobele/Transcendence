// src/backend/src/services/game/gameDbService.ts
import prisma from "../../prisma";
import { Room } from "./types";
import { Move } from "chess.js";

// Interface légère pour typer les joueurs de la partie
interface GamePlayersOnly {
  player1Id: number;
  player2Id: number;
}

/**
 * Récupère une partie avec ses coups associés
 */
export async function findGameWithMoves(gameId: number) {
  return await prisma.game.findUnique({
    where: { id: gameId },
    include: { moves: true },
  });
}

/**
 * Termine une partie sans coup (abandon ou nulle proposée)
 * Libère également les deux joueurs de leur partie en cours
 */
export async function saveGameOverNoMove(
  gameId: number,
  status: string,
  winnerId: number | null,
  dbGame: GamePlayersOnly, // 🎯 Typage explicite plutôt que 'any'
) {
  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: { 
        status, 
        endTime: new Date(), 
        winnerId 
      },
    }),
    prisma.user.update({ 
      where: { id: dbGame.player1Id }, 
      data: { currentGameId: null } 
    }),
    prisma.user.update({ 
      where: { id: dbGame.player2Id }, 
      data: { currentGameId: null } 
    }),
  ]);
}

/**
 * Exécute la transaction Prisma de sauvegarde en tâche de fond
 * Si la partie est terminée, libère les deux joueurs
 */
export function saveMoveToDatabase(
  gameId: number,
  userId: number,
  room: Room,
  moveResult: Move,
  nextFen: string,
  nextStatus: string,
  endTime: Date | null,
  winnerId: number | null,
  isGameOver: boolean,
  dbGame: GamePlayersOnly, // 🎯 Ici aussi
) {
  prisma
    .$transaction([
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
          isCastle:
            moveResult.flags.includes("k") || moveResult.flags.includes("q"),
          isEnPassant: moveResult.flags.includes("e"),
          promotionPiece: moveResult.promotion
            ? moveResult.promotion.toUpperCase()
            : null,
        },
      }),
      prisma.game.update({
        where: { id: gameId },
        data: { fenString: nextFen, status: nextStatus, endTime, winnerId },
      }),
      ...(isGameOver
        ? [
            prisma.user.update({
              where: { id: dbGame.player1Id },
              data: { currentGameId: null },
            }),
            prisma.user.update({
              where: { id: dbGame.player2Id },
              data: { currentGameId: null },
            }),
          ]
        : []),
    ])
    .catch((err) =>
      console.error(
        "[-] Erreur critique lors de l'enregistrement Prisma :",
        err,
      ),
    );
}