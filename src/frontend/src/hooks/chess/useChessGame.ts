import { useState } from "react";
import { Chess } from "chess.js";
import type {
  CapturedPiece,
  PendingPromotion,
  AnimatingPiece,
  CustomMove
} from "../../types/types";
import { playMoveSound } from "./chessSoundService";
import { extractCapturedPieces } from "./chessUtils";
import { useChessDragAndDrop } from "./useChessDragAndDrop"; // 🚀 Import du sous-hook

export const useChessGame = (
  playerColor: "white" | "black" = "white",
  onMovePlayed?: (moveData: { from: string; to: string; promotion?: string }) => void,
) => {
  const [game] = useState(() => new Chess());
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [animatingPiece, setAnimatingPiece] = useState<AnimatingPiece | null>(null);
  const [customHistory, setCustomHistory] = useState<CustomMove[]>([]);

  const isMyTurn = () => {
    const currentTurn = game.turn();
    const expectedTurn = playerColor === "white" ? "w" : "b";
    return currentTurn === expectedTurn;
  };

  const syncWithServerFen = (fen: string, history?: CustomMove[]) => {
    game.load(fen);
    setBoard(game.board());
    setCapturedPieces(extractCapturedPieces(game));
    if (history) setCustomHistory(history);
  };

  const makeMove = (
    from: string,
    to: string,
    promotion?: string,
    animate = true,
    isExternal = false,
  ) => {
    const piece = game.get(from as any);
    const move = game.move({
      from: from as any,
      to: to as any,
      ...(promotion && { promotion: promotion as any }),
    });

    if (move) {
      setBoard(game.board());
      setSelected(null);
      setLastMove({ from, to });
      setCapturedPieces(extractCapturedPieces(game));
      playMoveSound(move, game);

      const newMoveObj: CustomMove = {
        piece: move.piece.toUpperCase(),
        from: move.from,
        to: move.to,
        isCheck: game.inCheck(),
        isCheckmate: game.isCheckmate()
      };
      setCustomHistory((prev) => [...prev, newMoveObj]);

      if (!isExternal && onMovePlayed) {
        onMovePlayed({ from, to, promotion });
      }

      if (animate && piece) {
        const fromEl = document.querySelector(`[data-square="${from}"]`);
        const toEl = document.querySelector(`[data-square="${to}"]`);
        const fromRect = fromEl?.getBoundingClientRect();
        const toRect = toEl?.getBoundingClientRect();

        if (fromRect && toRect) {
          setAnimatingPiece({
            pieceKey: `${piece.color}${piece.type.toUpperCase()}`,
            toSquare: to,
            fromX: fromRect.left + fromRect.width / 2,
            fromY: fromRect.top + fromRect.height / 2,
            toX: toRect.left + toRect.width / 2,
            toY: toRect.top + toRect.height / 2,
          });
        }
      }
    }
    return move;
  };

  // 🚀 Branchement de la mécanique Drag & Drop externe
  const {
    dragPiece,
    dragEndedAt,
    handlePiecePointerDown,
    clearDragState,
  } = useChessDragAndDrop({
    game,
    isMyTurn,
    setSelected,
    setPendingPromotion,
    makeMove,
  });

  const handleSquareClick = (square: string) => {
    if (!isMyTurn()) return;
    if (dragEndedAt.current === square) {
      dragEndedAt.current = null;
      return;
    }
    if (pendingPromotion) {
      handlePromotionChoice(square);
      return;
    }
    if (selected === square) {
      setSelected(null);
      return;
    }

    const clickedPiece = game.get(square as any);
    if (clickedPiece && clickedPiece.color === game.turn()) {
      setSelected(square);
    } else if (selected !== null) {
      const possibleMoves = game
        .moves({ square: selected as any, verbose: true })
        .map((m: any) => m.to);

      if (possibleMoves.includes(square)) {
        const allMoves = game.moves({ square: selected as any, verbose: true });
        const moveData = allMoves.find((m: any) => m.to === square);

        if (moveData && moveData.flags.includes("p")) {
          setPendingPromotion({ from: selected, to: square });
          setSelected(null);
        } else {
          makeMove(selected, square);
        }
      } else {
        setSelected(null);
      }
    }
  };

  const handlePromotionChoice = (piece: string) => {
    if (!pendingPromotion) return;
    const pieceMap: { [key: string]: string } = {
      queen: "q", rook: "r", bishop: "b", knight: "n",
      q: "q", r: "r", b: "b", n: "n",
    };

    const promotionType = pieceMap[piece.toLowerCase()];
    if (!promotionType) return;

    makeMove(pendingPromotion.from, pendingPromotion.to, promotionType);
    setPendingPromotion(null);
  };

  const resetGame = () => {
    game.reset();
    setBoard(game.board());
    setSelected(null);
    setLastMove(null);
    setCapturedPieces([]);
    setPendingPromotion(null);
    setCustomHistory([]);
    clearDragState();
    document.body.classList.remove("dragging");
  };

  return {
    game,
    board,
    selected,
    lastMove,
    makeMove,
    dragPiece,
    animatingPiece,
    clearAnimation: () => setAnimatingPiece(null),
    handleSquareClick,
    handlePiecePointerDown,
    resetGame,
    capturedPieces,
    pendingPromotion,
    handlePromotionChoice,
    syncWithServerFen,
    customHistory,
    setCustomHistory,
  };
};