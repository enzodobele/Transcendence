import { WebSocket } from "ws";
import { Chess } from "chess.js";

export interface Room {
  gameId: number;
  players: { [userId: number]: WebSocket };
  spectators: Set<WebSocket>;
  game: Chess;
  pendingDrawOfferId?: number;
  isGameOver?: boolean;
}
