import React from "react";
import { PIECE_SVG } from "../constants/pieces";

interface PieceProps {
  square: string;
  piece: any;
  isDragging: boolean;
  isSelected: boolean;
  onDragStart: (square: string, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export const Piece: React.FC<PieceProps> = ({
  square,
  piece,
  isDragging,
  isSelected,
  onDragStart,
  onDragEnd,
}) => {
  if (!piece) return null;

  let opacityValue = 1;
  if (isDragging && isSelected) {
    opacityValue = 0.3;
  }

  return (
    <img
      draggable={true}
      onDragStart={(e) => onDragStart(square, e)}
      onDragEnd={onDragEnd}
      src={PIECE_SVG[`${piece.color}${piece.type.toUpperCase()}` as keyof typeof PIECE_SVG]}
      alt={`${piece.color}${piece.type}`}
      style={{
        width: "90%",
        height: "90%",
        pointerEvents: "auto",
        cursor: "grab",
        userSelect: "none",
        opacity: opacityValue,
      }}
    />
  );
};
