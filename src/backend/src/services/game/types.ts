import { WebSocket } from "ws";
import { Chess } from "chess.js";

export interface Room {
  gameId: number;
  players: { [userId: number]: WebSocket };
  game: Chess;
}
