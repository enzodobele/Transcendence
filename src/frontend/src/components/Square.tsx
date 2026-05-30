import React from "react";
import { Piece } from "./Piece";

interface SquareProps {
  square: string;
  piece: any;
  isLight: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  isCapture: boolean;
  lastMove: { from: string; to: string } | null;
  isDragging: boolean;
  onClick: (square: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (square: string, e: React.DragEvent) => void;
  onDragStart: (square: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const Square: React.FC<SquareProps> = ({
  square,
  piece,
  isLight,
  isSelected,
  isPossibleMove,
  isCapture,
  lastMove,
  isDragging,
  onClick,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
}) => {
  let backgroundColor = "#8d9dad";
  if (isSelected) {
    backgroundColor = "#ffd166";
  } else if (lastMove && square === lastMove.from) {
    backgroundColor = "#8ecddf";
  } else if (lastMove && square === lastMove.to) {
    backgroundColor = "#8ecddf";
  } else if (isLight) {
    backgroundColor = "#bcc3cd";
  }

  let borderColor = "transparent";
  if (isSelected) {
    borderColor = "#ffd166";
  }

  return (
    <div
      key={square}
      onClick={() => onClick(square)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(square, e)}
      style={{
        width: 100,
        height: 100,
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: `4px solid ${borderColor}`,
        boxSizing: "border-box",
        position: "relative",
        overflow: "visible",
      }}
    >
      {isPossibleMove && !isCapture && (
        <div
          style={{
            position: "absolute",
            width: 30,
            height: 30,
            backgroundColor: "rgba(80, 200, 120, 0.35)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}
      {isPossibleMove && isCapture && (
        <div
          style={{
            position: "absolute",
            width: 84,
            height: 84,
            border: "8px solid rgba(80, 200, 120, 0.35)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}
      <Piece
        square={square}
        piece={piece}
        isDragging={isDragging}
        isSelected={isSelected}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />
    </div>
  );
};
