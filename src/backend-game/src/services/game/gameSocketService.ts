// src/backend/src/services/game/gameSocketService.ts
import { WebSocketServer } from "ws";
import http from "http";
import {
  handleGameConnection,
  handleSpectatorConnection,
  removePlayerFromRoom,
  removeSpectatorFromRoom,
  broadcastToSpectators,
} from "./gameRoomManager";
import { startDisconnectionTimer, cancelDisconnectionTimer } from "./disconnectionManager";
import { handleAuthAndValidation } from "./handlers/authHandler";
import { handlePlayerMove } from "./handlers/moveHandler";
import {
  handleResign,
  handleDrawOffer,
  handleDrawAccept,
  handleDrawRefuse,
  handleClaimVictory,
} from "./handlers/actionHandler";

export const initGameWebSocket = (server: http.Server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (socket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const gameIdParam = url.searchParams.get("gameId");
    const spectatorParam = url.searchParams.get("spectator");

    const validation = await handleAuthAndValidation(socket, token, gameIdParam, spectatorParam);
    if (!validation) return;

    if (validation.spectator) {
      const spectatorValidation = validation as any;
      const spectatorGameId: number = spectatorValidation.gameId;
      const room = handleSpectatorConnection(socket, spectatorGameId, spectatorValidation.dbGame);

      const movesFromDb = spectatorValidation.dbGame.moves ? spectatorValidation.dbGame.moves.sort((a: any, b: any) => a.id - b.id) : [];
      const customMoveHistory = movesFromDb.map((m: any) => ({
        piece: m.piece,
        from: m.fromSquare,
        to: m.toSquare,
        isCheck: m.isCheck,
        isCheckmate: m.isCheckmate,
      }));

      socket.send(
        JSON.stringify({
          type: "sync",
          color: "spectator",
          fen: room.game.fen(),
          history: customMoveHistory,
          player1Username: spectatorValidation.dbGame.player1?.username ?? "",
          player2Username: spectatorValidation.dbGame.player2?.username ?? "",
        }),
      );

      socket.on("close", () => {
        removeSpectatorFromRoom(spectatorGameId, socket);
      });

      return;
    }

    const playerValidation = validation as any;
    const userId: number = playerValidation.userId;
    const gameId: number = playerValidation.gameId;
    const dbGame = playerValidation.dbGame;
    const room = handleGameConnection(socket, gameId, userId, dbGame);

    // 🔄 TENTATIVE D'ANNULATION DU TIMER AFK (Reconnexion d'un joueur)
    cancelDisconnectionTimer(gameId, userId, room, dbGame);

    // Synchronisation de l'historique
    const movesFromDb = dbGame.moves ? dbGame.moves.sort((a: any, b: any) => a.id - b.id) : [];
    const customMoveHistory = movesFromDb.map((m: any) => ({
      piece: m.piece,
      from: m.fromSquare,
      to: m.toSquare,
      isCheck: m.isCheck,
      isCheckmate: m.isCheckmate,
    }));

    const color = userId === dbGame.player1Id ? "white" : "black";
    socket.send(
      JSON.stringify({
        type: "sync",
        color,
        fen: room.game.fen(),
        history: customMoveHistory,
      }),
    );

    // Notification de connexion
    const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
    if (room.players[opponentId]) {
      room.players[opponentId].send(JSON.stringify({ type: "opponent_connected" }));
    }

    broadcastToSpectators(room, { type: "opponent_connected" });

    // Aiguillage des messages
    socket.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        
        switch (parsed.type) {
          case "move":
            await handlePlayerMove(socket, data, userId, gameId, room, dbGame);
            break;
          case "resign":
            await handleResign(userId, gameId, room, dbGame);
            break;
          case "draw_offer":
            handleDrawOffer(userId, room, dbGame);
            break;
          case "draw_accept":
            await handleDrawAccept(userId, gameId, room, dbGame);
            break;
          case "draw_refuse":
            handleDrawRefuse(userId, room, dbGame);
            break;
          case "claim_victory":
            await handleClaimVictory(userId, gameId, room, dbGame);
            break;
        }
      } catch (err) {
        console.error("[WS Router] Erreur traitement du message:", err);
      }
    });

socket.on("close", () => {
  console.log(`[WS Close] Déconnexion détectée pour l'user ${userId} (Game ${gameId}).`);
  
  // 1. On retire le joueur de la room mémoire
  removePlayerFromRoom(gameId, userId);
  
  // 2. On vérifie si la partie est déjà finie (soit via notre flag manuel, soit via chess.js)
  const isFinished = room.isGameOver || (room.game && room.game.isGameOver());

  if (isFinished) {
    console.log(`[WS Close] La partie #${gameId} est déjà terminée. Pas de timer de déconnexion inutile.`);
    return;
  }

  // 3. Si la partie est toujours en cours, ALORS on lance le timer de déconnexion
  console.log(`[WS Close] Partie #${gameId} toujours active. Lancement du timer pour l'user ${userId}...`);
  startDisconnectionTimer(gameId, userId, room, dbGame);
});
  });
};