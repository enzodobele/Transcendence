// src/backend/src/services/game/gameSocketService.ts
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { verifyToken } from "../jwtService";
import { Room } from "./types";
import {
  handleGameConnection,
  removePlayerFromRoom,
  checkGameStatus,
} from "./gameRoomManager";
import { findGameWithMoves, saveMoveToDatabase } from "./gameDbService";

export const initGameWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (socket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const gameIdParam = url.searchParams.get("gameId");

    const validation = await handleAuthAndValidation(
      socket,
      token,
      gameIdParam,
    );
    if (!validation) return;

    const { userId, gameId, dbGame } = validation;

    // Gestion de la connexion RAM
    const room = handleGameConnection(socket, gameId, userId, dbGame);

    // 🚀 MODIFICATION 1 : Reconstruction de l'historique sous forme d'objets structurés depuis la BDD
    const movesFromDb = dbGame.moves
      ? dbGame.moves.sort((a: any, b: any) => a.id - b.id)
      : [];
    const customMoveHistory = movesFromDb.map((m: any) => ({
      piece: m.piece,
      from: m.fromSquare,
      to: m.toSquare,
      isCheck: m.isCheck,
      isCheckmate: m.isCheckmate,
    }));

    // Envoi de l'état initial personnalisé au client (Sync)
    const color = userId === dbGame.player1Id ? "white" : "black";
    socket.send(
      JSON.stringify({
        type: "sync",
        color,
        fen: room.game.fen(),
        history: customMoveHistory, // 👈 On envoie le tableau d'objets
      }),
    );

    // Notification de l'adversaire
    const opponentId =
      userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
    if (room.players[opponentId]) {
      room.players[opponentId].send(
        JSON.stringify({ type: "opponent_connected" }),
      );
    }

    // Gestionnaires d'événements
    socket.on("message", async (data) => {
      await handlePlayerMove(socket, data, userId, gameId, room, dbGame);
    });

    socket.on("close", () => {
      removePlayerFromRoom(gameId, userId);
    });
  });
};

/**
 * Gère l'authentification JWT et l'accès à la partie
 */
async function handleAuthAndValidation(socket: WebSocket, token: string | null, gameIdParam: string | null) {
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

/**
 * Traite les inputs réseaux des coups, valide et distribue
 */
async function handlePlayerMove(
  socket: WebSocket,
  data: any,
  userId: number,
  gameId: number,
  room: Room,
  dbGame: any,
) {
  try {
    const parsed = JSON.parse(data.toString());
    if (parsed.type !== "move") return;

    const { from, to, promotion } = parsed.data;
    const currentTurn = room.game.turn();
    const expectedColor = userId === dbGame.player1Id ? "w" : "b";

    if (currentTurn !== expectedColor) {
      socket.send(
        JSON.stringify({ type: "error", message: "Ce n'est pas ton tour !" }),
      );
      return;
    }

    const cleanPromotion = promotion ? promotion.toLowerCase() : undefined;
    let moveResult;

    try {
      moveResult = room.game.move({ from, to, promotion: cleanPromotion });
    } catch {
      socket.send(
        JSON.stringify({
          type: "error",
          message: "Coup illégal ou format incorrect.",
        }),
      );
      return;
    }

    if (!moveResult) {
      socket.send(JSON.stringify({ type: "error", message: "Coup illégal." }));
      return;
    }

    const nextFen = room.game.fen();
    const { nextStatus, winnerId, endTime, isGameOver } = checkGameStatus(
      room,
      dbGame,
    );
    const opponentId =
      userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;

    // 🚀 MODIFICATION 2 : On inclut les détails de la pièce et des échecs pour les diffusions en temps réel
    const movePayload = {
      from: moveResult.from,
      to: moveResult.to,
      promotion: moveResult.promotion,
      piece: moveResult.piece.toUpperCase(), // Ex: 'P', 'N', 'R'...
      isCheck: room.game.inCheck(),
      isCheckmate: room.game.isCheckmate(),
    };

    socket.send(
      JSON.stringify({
        type: "move_confirmed",
        move: movePayload,
        fen: nextFen,
      }),
    );

    if (room.players[opponentId]) {
      room.players[opponentId].send(
        JSON.stringify({
          type: "opponent_move",
          move: movePayload,
          fen: nextFen,
        }),
      );
    }

    // Sauvegarde asynchrone en BDD (ne bloque pas le thread socket principal)
    saveMoveToDatabase(
      gameId,
      userId,
      room,
      moveResult,
      nextFen,
      nextStatus,
      endTime,
      winnerId,
      isGameOver,
      dbGame,
    );
  } catch (error) {
    console.error("[Backend WS] Erreur critique :", error);
    socket.send(
      JSON.stringify({
        type: "error",
        message: "Format ou traitement de message invalide",
      }),
    );
  }
}
