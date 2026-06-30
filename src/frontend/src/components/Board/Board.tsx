import React from "react";
import { Square2D } from "./Square2D";
import { FILES, RANKS } from "../../constants/pieces";

interface BoardProps {
  board: any[][];
  game: any;
  selected: string | null;
  lastMove: { from: string; to: string } | null;
  dragSquare: string | null;
  animatingToSquare: string | null;
  onSquareClick: (square: string) => void;
  onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
  playerColor: "white" | "black"; // 👑 Préservé : Couleur du joueur
}

export const Board: React.FC<BoardProps> = ({
  board,
  game,
  selected,
  lastMove,
  dragSquare,
  animatingToSquare,
  onSquareClick,
  onPiecePointerDown,
  playerColor,
}) => {
  // 👑 Préservé : Inversion des index si le joueur est noir
  const isBlack = playerColor === "black";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 100px)",
        gap: 0,
        marginBottom: "20px",
      }}
    >
      {board.map((_row, rowIndex) => {
        // Si Noir : on part du bas du tableau vers le haut
        const actualRowIndex = isBlack ? 7 - rowIndex : rowIndex;
        const currentRow = board[actualRowIndex];

        return currentRow.map((_piece, colIndex) => {
          // Si Noir : on inverse aussi les colonnes (de 'h' à 'a')
          const actualColIndex = isBlack ? 7 - colIndex : colIndex;
          const actualPiece = currentRow[actualColIndex];

          const file = FILES[actualColIndex];
          const rank = RANKS[actualRowIndex];
          const square = file + rank;

          // La couleur de la case dépend des coordonnées mathématiques de l'échiquier
          const isLight = (actualColIndex + actualRowIndex) % 2 === 0;

          // ⚡ Fusion des logiques de sélection (avec la nouvelle variable dragSquare de ton mate)
          const isSelected = dragSquare
            ? dragSquare === square
            : selected === square;
          const isBeingDragged = dragSquare === square;

          let possibleMoves: string[] = [];
          const sourceSquare = dragSquare ?? selected;

          if (sourceSquare) {
            possibleMoves = game
              .moves({ square: sourceSquare, verbose: true })
              .map((m: any) => m.to);
          }

          const isPossibleMove = possibleMoves.includes(square);
          const isCapture = isPossibleMove && actualPiece;

          return (
            <Square2D
              key={square}
              square={square}
              piece={actualPiece} // 👑 Préservé : On envoie la pièce inversée
              isLight={isLight}
              isSelected={isSelected}
              isPossibleMove={isPossibleMove}
              isCapture={isCapture}
              isBeingDragged={isBeingDragged} // ⚡ Nouveau : État de drag de ton mate
              isAnimatingTarget={animatingToSquare === square} // ⚡ Nouveau : État d'animation de ton mate
              lastMove={lastMove}
              onClick={onSquareClick}
              onPiecePointerDown={onPiecePointerDown} // ⚡ Nouveau : Pointer Events
            />
          );
        });
      })}
    </div>
  );
};
