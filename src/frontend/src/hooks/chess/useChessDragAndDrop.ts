import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { DragPiece, PendingPromotion } from "../../types/types";

interface UseChessDragAndDropProps {
  game: Chess;
  isMyTurn: () => boolean;
  setSelected: (square: string | null) => void;
  setPendingPromotion: (promo: PendingPromotion | null) => void;
  makeMove: (from: string, to: string, promotion?: string, animate?: boolean) => any;
}

export function useChessDragAndDrop({
  game,
  isMyTurn,
  setSelected,
  setPendingPromotion,
  makeMove,
}: UseChessDragAndDropProps) {
  const [dragPiece, setDragPiece] = useState<DragPiece | null>(null);
  const dragRef = useRef<{
    square: string;
    startX: number;
    startY: number;
    started: boolean;
  } | null>(null);
  const dragEndedAt = useRef<string | null>(null);

  const handlePiecePointerDown = (square: string, e: React.PointerEvent) => {
    if (!isMyTurn()) return;
    const piece = game.get(square as any);
    if (!piece || piece.color !== game.turn()) return;

    e.preventDefault();
    dragRef.current = {
      square,
      startX: e.clientX,
      startY: e.clientY,
      started: true,
    };
    setDragPiece({ square, x: e.clientX, y: e.clientY });
    document.body.classList.add("dragging");
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      setDragPiece({
        square: dragRef.current.square,
        x: e.clientX,
        y: e.clientY,
      });
    };

    const onUp = (e: PointerEvent) => {
      const ref = dragRef.current;
      dragRef.current = null;
      document.body.classList.remove("dragging");
      setDragPiece(null);

      if (!ref) return;
      if (Math.hypot(e.clientX - ref.startX, e.clientY - ref.startY) <= 3) return;

      const elem = document.elementFromPoint(e.clientX, e.clientY);
      const squareEl = elem?.closest("[data-square]") as HTMLElement | null;
      const targetSquare = squareEl?.dataset.square;

      if (targetSquare && targetSquare !== ref.square) {
        const allMoves = game.moves({
          square: ref.square as any,
          verbose: true,
        });
        const moveData = allMoves.find((m: any) => m.to === targetSquare);

        if (!moveData) {
          dragEndedAt.current = targetSquare;
          setSelected(ref.square);
        } else if (moveData.flags.includes("p")) {
          setPendingPromotion({ from: ref.square, to: targetSquare });
          setSelected(null);
        } else {
          makeMove(ref.square, targetSquare, undefined, false);
        }
      } else {
        if (targetSquare) dragEndedAt.current = targetSquare;
        setSelected(ref.square);
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [game, makeMove, setSelected, setPendingPromotion]);

  const clearDragState = () => {
    setDragPiece(null);
    dragRef.current = null;
    dragEndedAt.current = null;
  };

  return {
    dragPiece,
    dragEndedAt,
    handlePiecePointerDown,
    clearDragState,
  };
}