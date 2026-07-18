// src/backend/src/services/game/handlers/moveHandler.ts
import { WebSocket } from "ws";
import { Room } from "../types";
import { checkGameStatus, broadcastToSpectators } from "../gameRoomManager";
import { saveMoveToDatabase } from "../gameDbService";

export async function handlePlayerMove(
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
      socket.send(JSON.stringify({ type: "error", message: "Ce n'est pas ton tour !" }));
      return;
    }

    const cleanPromotion = promotion ? promotion.toLowerCase() : undefined;
    let moveResult;

    try {
      moveResult = room.game.move({ from, to, promotion: cleanPromotion });
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "Coup illégal ou format incorrect." }));
      return;
    }

    if (!moveResult) {
      socket.send(JSON.stringify({ type: "error", message: "Coup illégal." }));
      return;
    }

    const nextFen = room.game.fen();
    const { nextStatus, winnerId, endTime, isGameOver } = checkGameStatus(room, dbGame);
    const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;

    const movePayload = {
      from: moveResult.from,
      to: moveResult.to,
      promotion: moveResult.promotion,
      piece: moveResult.piece.toUpperCase(),
      isCheck: room.game.inCheck(),
      isCheckmate: room.game.isCheckmate(),
    };

    socket.send(JSON.stringify({ type: "move_confirmed", move: movePayload, fen: nextFen }));

    if (room.players[opponentId]) {
      room.players[opponentId].send(
        JSON.stringify({ type: "opponent_move", move: movePayload, fen: nextFen })
      );
    }

    broadcastToSpectators(room, { type: "opponent_move", move: movePayload, fen: nextFen });

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
    console.error("[Backend WS] Erreur critique Move :", error);
    socket.send(JSON.stringify({ type: "error", message: "Format ou traitement de message invalide" }));
  }
}