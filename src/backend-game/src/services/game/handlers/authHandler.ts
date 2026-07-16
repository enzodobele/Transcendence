// src/backend/src/services/game/handlers/authHandler.ts

import { WebSocket } from "ws";
import { verifyToken } from "../../jwtService";
import { findGameWithMoves } from "../gameDbService";

export async function handleAuthAndValidation(socket: WebSocket, token: string | null, gameIdParam: string | null) {
  if (!token || !gameIdParam) {
    socket.close(1008, "Token ou gameId manquant");
    return null;
  }

  const gameId = parseInt(gameIdParam, 10);

  try {
    const payload = verifyToken(token);
    if (!payload) throw new Error();

    const dbGame = await findGameWithMoves(gameId);

    if (!dbGame || dbGame.status !== "en_cours") {
      socket.close(4004, "Partie introuvable ou terminée");
      return null;
    }
    if (
      dbGame.player1Id !== payload.userId &&
      dbGame.player2Id !== payload.userId
    ) {
      socket.close(1008, "Tu ne fais pas partie de cette game");
      return null;
    }

    return { userId: payload.userId, gameId, dbGame };
  } catch {
    socket.close(1008, "Accès refusé / Token invalide");
    return null;
  }
}