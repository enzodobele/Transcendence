// src/frontend/src/hooks/chess/chessUtils.ts
import { Chess } from "chess.js";
import type { CapturedPiece } from "../../types/types";

/**
 * Parcourt l'historique de la partie pour en extraire la liste des pièces capturées
 */
export const extractCapturedPieces = (game: Chess): CapturedPiece[] => {
  const captured: CapturedPiece[] = [];
  const moves = game.history({ verbose: true });

  moves.forEach((move) => {
    if (move.captured) {
      const captureColor: "w" | "b" = move.color === "w" ? "b" : "w";
      captured.push({ type: move.captured, color: captureColor });
    }
  });

  return captured;
};
