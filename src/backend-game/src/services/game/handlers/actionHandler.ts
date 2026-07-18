// src/backend/src/services/game/handlers/actionHandler.ts
import { WebSocket } from "ws";
import { Room } from "../types";
import { saveGameOverNoMove } from "../gameDbService";
import { isVictoryClaimable, clearTimer } from "../disconnectionManager";
import { broadcastToSpectators } from "../gameRoomManager";

function broadcast(room: Room, dbGame: any, payload: object) {
  const msg = JSON.stringify(payload);
  for (const id of [dbGame.player1Id, dbGame.player2Id]) {
    room.players[id]?.send(msg);
  }

  broadcastToSpectators(room, payload);
}

export async function handleResign(userId: number, gameId: number, room: Room, dbGame: any) {
  const winnerId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
  const winnerColor = winnerId === dbGame.player1Id ? "white" : "black";
  
  // 🚨 ON MARQUE LA ROOM COMME TERMINÉE
  room.isGameOver = true; 

  clearTimer(gameId, userId);
  await saveGameOverNoMove(gameId, "terminee", winnerId, dbGame);
  broadcast(room, dbGame, { type: "game_over", reason: "resign", winnerColor });
}

export function handleDrawOffer(userId: number, room: Room, dbGame: any) {
  room.pendingDrawOfferId = userId;
  const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
  room.players[opponentId]?.send(JSON.stringify({ type: "draw_offer" }));
}

export async function handleDrawAccept(userId: number, gameId: number, room: Room, dbGame: any) {
  if (room.pendingDrawOfferId === undefined || room.pendingDrawOfferId === userId) return;
  room.pendingDrawOfferId = undefined;
  
  // 🚨 ON MARQUE LA ROOM COMME TERMINÉE
  room.isGameOver = true;

  clearTimer(gameId, dbGame.player1Id);
  clearTimer(gameId, dbGame.player2Id);
  
  await saveGameOverNoMove(gameId, "nulle", null, dbGame);
  broadcast(room, dbGame, { type: "game_over", reason: "draw" });
}

export function handleDrawRefuse(userId: number, room: Room, dbGame: any) {
  if (room.pendingDrawOfferId === undefined || room.pendingDrawOfferId === userId) return;
  room.pendingDrawOfferId = undefined;
  const offeringPlayerId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
  room.players[offeringPlayerId]?.send(JSON.stringify({ type: "draw_refused" }));
}

export async function handleClaimVictory(userId: number, gameId: number, room: Room, dbGame: any) {
  const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
  const isOpponentOnline = !!room.players[opponentId];

  if (isVictoryClaimable(gameId, opponentId, isOpponentOnline)) {
    // 🚨 ON MARQUE LA ROOM COMME TERMINÉE
    room.isGameOver = true;

    clearTimer(gameId, opponentId);
    const winnerColor = userId === dbGame.player1Id ? "white" : "black";
    
    await saveGameOverNoMove(gameId, "terminee", userId, dbGame);
    broadcast(room, dbGame, { type: "game_over", reason: "abandon", winnerColor });
  } else {
    room.players[userId]?.send(
      JSON.stringify({ type: "error", message: "Impossible de clamer la victoire pour le moment." })
    );
  }
}