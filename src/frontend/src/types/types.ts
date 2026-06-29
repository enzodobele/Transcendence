

export interface PendingPromotion {
  from: string;
  to: string;
}

export interface DragPiece {
  square: string;
  x: number;
  y: number;
}

export interface AnimatingPiece {
  pieceKey: string;
  toSquare: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface CustomMove {
  piece: string;
  from: string;
  to: string;
  isCheck: boolean;
  isCheckmate: boolean;
}

export interface CapturedPiece {
  type: string;
  color: "w" | "b";
}