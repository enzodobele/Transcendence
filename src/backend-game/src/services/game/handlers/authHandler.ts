// src/backend/src/services/game/handlers/authHandler.ts

import { WebSocket } from "ws";
import { verifyToken } from "../../jwtService";
import { findGameWithMoves } from "../gameDbService";

type AuthValidationResult =
  | {
      spectator: true;
      gameId: number;
      dbGame: any;
    }
  | {
      spectator: false;
      userId: number;
      gameId: number;
      dbGame: any;
    }
  | null;

export async function handleAuthAndValidation(
  socket: WebSocket,
  token: string | null,
  gameIdParam: string | null,
  spectatorParam: string | null,
): Promise<AuthValidationResult> {
  if (!gameIdParam) {
    socket.close(1008, "gameId manquant");
    return null;
  }

  const gameId = parseInt(gameIdParam, 10);
  const isSpectator = spectatorParam === "1" || spectatorParam === "true" || spectatorParam === "spectator";

  try {
    const dbGame = await findGameWithMoves(gameId);

    if (!dbGame || dbGame.status !== "en_cours") {
      socket.close(4004, "Partie introuvable ou terminée");
      return null;
    }

    if (isSpectator) {
      // Si un joueur authentifié de cette partie tente de se connecter en spectateur,
      // on refuse pour éviter les incohérences de double connexion joueur/spectateur.
      if (token) {
        const payload = verifyToken(token);
        if (
          payload &&
          (dbGame.player1Id === payload.userId || dbGame.player2Id === payload.userId)
        ) {
          socket.close(1008, "Un joueur actif ne peut pas spectate cette partie");
          return null;
        }
      }

      return { spectator: true, gameId, dbGame };
    }

    if (!token) {
      socket.close(1008, "Token manquant");
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) throw new Error();

    if (
      dbGame.player1Id !== payload.userId &&
      dbGame.player2Id !== payload.userId
    ) {
      socket.close(1008, "Tu ne fais pas partie de cette game");
      return null;
    }

    return { userId: payload.userId, gameId, dbGame, spectator: false };
  } catch {
    socket.close(1008, "Accès refusé / Token invalide");
    return null;
  }
}