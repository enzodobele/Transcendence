import { useState } from "react";
import { Chess } from "chess.js";

export const useChessGame = () => {
  const [game] = useState(() => new Chess());
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSquareClick = (square: string) => {
    const clickedPiece = game.get(square as any);
    const currentTurn = game.turn();

    if (clickedPiece && clickedPiece.color === currentTurn) {
      setSelected(square);
    } else if (selected !== null) {
      const possibleMoves = game
        .moves({ square: selected as any, verbose: true })
        .map((m: any) => m.to);

      if (possibleMoves.includes(square)) {
        const move = game.move({ from: selected as any, to: square as any });
        if (move) {
          setBoard(game.board());
          setSelected(null);
          setLastMove({ from: selected, to: square });
        }
      } else {
        setSelected(null);
      }
    }
  };

  const handleDragStart = (square: string, e: React.DragEvent) => {
    const piece = game.get(square as any);
    const currentTurn = game.turn();
    if (piece && piece.color === currentTurn) {
      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/plain", square);
      setSelected(square);
      setIsDragging(true);
      e.dataTransfer!.setDragImage(e.target as HTMLImageElement, 45, 45);
    } else {
      e.dataTransfer!.effectAllowed = "none";
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };

  const handleDrop = (square: string, e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const fromSquare = e.dataTransfer!.getData("text/plain");
    if (!fromSquare) return;

    const possibleMoves = game
      .moves({ square: fromSquare as any, verbose: true })
      .map((m: any) => m.to);

    if (possibleMoves.includes(square)) {
      const move = game.move({ from: fromSquare as any, to: square as any });
      if (move) {
        setBoard(game.board());
        setSelected(null);
        setLastMove({ from: fromSquare, to: square });
      }
    }
  };

  const resetGame = () => {
    game.reset();
    setBoard(game.board());
    setSelected(null);
    setLastMove(null);
  };

  return {
    game,
    board,
    selected,
    lastMove,
    isDragging,
    setIsDragging,
    handleSquareClick,
    handleDragStart,
    handleDragOver,
    handleDrop,
    resetGame,
  };
};
