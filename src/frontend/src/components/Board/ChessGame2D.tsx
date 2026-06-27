import React from "react";
import { Board } from "./Board";
import "../../styles/Board/ChessGame2D.css";
import { PromotionDialog } from "./PromotionDialog";

interface ChessGame2DProps {
  game: any;
  board: any;
  selected: any;
  lastMove: any;
  dragSquare: string | null; // ⚡ Nouveau : Drag de ton mate
  animatingToSquare: string | null; // ⚡ Nouveau : Animation de ton mate
  pendingPromotion: boolean;
  onSquareClick: (square: string) => void;
  onPiecePointerDown: (square: string, e: React.PointerEvent) => void; // ⚡ Nouveau : Pointer Events
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
  playerColor: "white" | "black"; // 👑 Préservé : Couleur assignée
}

export function ChessGame2D({
  game,
  board,
  selected,
  lastMove,
  dragSquare,
  animatingToSquare,
  pendingPromotion,
  onSquareClick,
  onPiecePointerDown,
  onResetGame,
  onPromotionChoice,
  playerColor, // 👑 Préservé
}: ChessGame2DProps) {
  return (
    <div className="Board">
      <Board
        board={board}
        game={game}
        selected={selected}
        lastMove={lastMove}
        dragSquare={dragSquare} // ⚡ Passé au Board
        animatingToSquare={animatingToSquare} // ⚡ Passé au Board
        onSquareClick={onSquareClick}
        onPiecePointerDown={onPiecePointerDown} // ⚡ Passé au Board
        playerColor={playerColor} // 👑 Passé au Board pour l'inversion
      />

      <button onClick={onResetGame} className="reset-board">
        Réinitialiser
      </button>

      {pendingPromotion && (
        <PromotionDialog
          onChoose={onPromotionChoice}
          playerColor={game.turn() === "w" ? "b" : "w"}
        />
      )}
    </div>
  );
}
