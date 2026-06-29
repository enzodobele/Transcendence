import { ChessGame3D } from "./ChessGame3D";
import { ChessGame2D } from "./ChessGame2D";

interface GameViewProps {
  game: any;
  board: any;
  selected: string | null;
  lastMove: any;
  dragPiece: any;
  animatingPiece: any;
  capturedPieces: any[];
  pendingPromotion: any;
  customHistory: any[];
  playerColor: "white" | "black";
  userUsername?: string;
  opponentUsername?: string;
  isLocalGame: boolean;
  is3D: boolean;
  onSquareClick: (square: string) => void;
  onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
  onLeaveLocalGame: () => void;
}

export function GameView({
  game,
  board,
  selected,
  lastMove,
  dragPiece,
  animatingPiece,
  capturedPieces,
  pendingPromotion,
  playerColor,
  isLocalGame,
  is3D, // 🚀 Récupéré ici
  onSquareClick,
  onPiecePointerDown,
  onResetGame,
  onPromotionChoice,
  onLeaveLocalGame,
}: GameViewProps) {
  return (
    <div className="game-layout">
      <div className="game-container">
        <div className="chessboard-wrapper">
          {is3D ? (
            <ChessGame3D
              game={game}
              board={board}
              selected={selected}
              capturedPieces={capturedPieces}
              pendingPromotion={!!pendingPromotion}
              onSquareClick={onSquareClick}
              onResetGame={onResetGame}
              onPromotionChoice={onPromotionChoice}
            />
          ) : (
            <ChessGame2D
              game={game}
              board={board}
              selected={selected}
              lastMove={lastMove}
              dragSquare={dragPiece?.square ?? null}
              animatingToSquare={animatingPiece?.toSquare ?? null}
              pendingPromotion={!!pendingPromotion}
              onSquareClick={onSquareClick}
              onPiecePointerDown={onPiecePointerDown}
              onPromotionChoice={onPromotionChoice}
              playerColor={playerColor}
            />
          )}
        </div>
      </div>

      <div className="game-actions">
        {isLocalGame && (
          <button onClick={onLeaveLocalGame} className="button-leave-game">
            Quitter la partie locale
          </button>
        )}
      </div>
    </div>
  );
}