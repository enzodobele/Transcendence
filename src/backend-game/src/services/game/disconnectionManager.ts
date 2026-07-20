// src/backend-game/src/services/game/disconnectionManager.ts

import { Room } from "./types";

const DISCONNECT_TIMEOUT_MS = 5000;
const disconnectionTimers: Record<string, { timer: NodeJS.Timeout; expired: boolean }> = {};

export const getDisconnectTimeoutMs = () => DISCONNECT_TIMEOUT_MS;

/**
 * Lance le timer de déconnexion pour un joueur et notifie son adversaire
 */
export const startDisconnectionTimer = (gameId: number, userId: number, room: Room, dbGame: any) => {
  const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;

  // 1. Notifier immédiatement l'adversaire
  if (room.players[opponentId]) {
    room.players[opponentId].send(
      JSON.stringify({
        type: "opponent_disconnected",
        timeoutMs: DISCONNECT_TIMEOUT_MS,
      }),
    );
  }

  // 2. Armer le timer
  const timerKey = `${gameId}_${userId}`;
  disconnectionTimers[timerKey] = {
    expired: false,
    timer: setTimeout(() => {
      if (disconnectionTimers[timerKey]) {
        disconnectionTimers[timerKey].expired = true;
        console.log(`[Timeout] Le temps de reconnexion a expiré pour le joueur ${userId} (Game ${gameId}).`);
        
        if (room.players[opponentId]) {
          room.players[opponentId].send(
            JSON.stringify({ type: "claim_victory_available" }),
          );
        }
      }
    }, DISCONNECT_TIMEOUT_MS),
  };
};

/**
 * Annule un timer existant si le joueur revient avant la fin
 */
export const cancelDisconnectionTimer = (gameId: number, userId: number, room: Room, dbGame: any) => {
  const timerKey = `${gameId}_${userId}`;
  if (disconnectionTimers[timerKey]) {
    clearTimeout(disconnectionTimers[timerKey].timer);
    delete disconnectionTimers[timerKey];
    console.log(`[Reconnection] Joueur ${userId} reconnecté à la partie ${gameId}. Timer annulé.`);
    
    const opponentId = userId === dbGame.player1Id ? dbGame.player2Id : dbGame.player1Id;
    if (room.players[opponentId]) {
      room.players[opponentId].send(
        JSON.stringify({ type: "opponent_reconnected" }),
      );
    }
    return true;
  }
  return false;
};

/**
 * Vérifie si la réclamation de victoire est valide (l'adversaire est déconnecté et son timer a expiré)
 */
export const isVictoryClaimable = (gameId: number, opponentId: number, isOpponentOnline: boolean): boolean => {
  const timerKey = `${gameId}_${opponentId}`;
  const timerData = disconnectionTimers[timerKey];
  return !isOpponentOnline && !!timerData && timerData.expired;
};

/**
 * Nettoie le timer d'un joueur (après une fin de partie par exemple)
 */
export const clearTimer = (gameId: number, userId: number) => {
  const timerKey = `${gameId}_${userId}`;
  if (disconnectionTimers[timerKey]) {
    clearTimeout(disconnectionTimers[timerKey].timer);
    delete disconnectionTimers[timerKey];
  }
};