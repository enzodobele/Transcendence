import { PIECE_SVG } from "../../constants/pieces";
import type { DragPiece } from "../../types/types";

interface FloatingPieceProps {
  dragPiece: DragPiece | null;
  game: any;
}

export function FloatingPiece({ dragPiece, game }: FloatingPieceProps) {
  if (!dragPiece) return null;
  const piece = game.get(dragPiece.square);
  if (!piece) return null;
  const key = `${piece.color}${piece.type.toUpperCase()}`;

  return (
    <img
      src={PIECE_SVG[key as keyof typeof PIECE_SVG]}
      style={{
        position: "fixed",
        left: dragPiece.x - 40,
        top: dragPiece.y - 40,
        width: 80,
        height: 80,
        pointerEvents: "none",
        zIndex: 9999,
        userSelect: "none",
      }}
    />
  );
}
