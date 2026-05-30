import React from "react";
import { Square } from "./Square";
import { FILES, RANKS } from "../constants/pieces";

interface BoardProps {
  board: any[][];
  game: any;
  selected: string | null;
  lastMove: { from: string; to: string } | null;
  isDragging: boolean;
  onSquareClick: (square: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (square: string, e: React.DragEvent) => void;
  onDragStart: (square: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  game,
  selected,
  lastMove,
  isDragging,
  onSquareClick,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 100px)",
        gap: 0,
        marginBottom: "20px",
      }}
    >
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => {
          const file = FILES[colIndex];
          const rank = RANKS[rowIndex];
          const square = file + rank;
          const isLight = (colIndex + rowIndex) % 2 === 0;
          const isSelected = selected === square;

          let possibleMoves: string[] = [];
          if (selected) {
            possibleMoves = game.moves({ square: selected, verbose: true }).map((m: any) => m.to);
          }
          const isPossibleMove = possibleMoves.includes(square);
          const isCapture = isPossibleMove && piece;

          return (
            <Square
              key={square}
              square={square}
              piece={piece}
              isLight={isLight}
              isSelected={isSelected}
              isPossibleMove={isPossibleMove}
              isCapture={isCapture}
              lastMove={lastMove}
              isDragging={isDragging}
              onClick={onSquareClick}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          );
        })
      )}
    </div>
  );
};
