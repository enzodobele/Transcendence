import { useState } from "react";
import { ChessGame3D } from "./ChessGame3D";
import { ChessGame2D } from "./ChessGame2D";
import { MoveHistory } from "./MoveHistory";

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
  customHistory,
  playerColor,
  userUsername,
  opponentUsername,
  isLocalGame,
  onSquareClick,
  onPiecePointerDown,
  onResetGame,
  onPromotionChoice,
  onLeaveLocalGame,
}: GameViewProps) {
  const [is3D, setIs3D] = useState(false);

  return (
    <>
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
              onResetGame={onResetGame}
              onPromotionChoice={onPromotionChoice}
              playerColor={playerColor}
            />
          )}
        </div>

        <MoveHistory
          history={customHistory}
          player1Name={isLocalGame ? "Blancs (Local)" : userUsername || "Joueur 1"}
          player2Name={isLocalGame ? "Noirs (Local)" : opponentUsername || "Joueur 2"}
        />
      </div>

      <div className="game-actions">
        {isLocalGame && (
          <button onClick={onLeaveLocalGame} className="button-leave-game">
            Quitter la partie locale
          </button>
        )}
        <button onClick={() => setIs3D(!is3D)} className="button-switch-2d-3d">
          {is3D ? "Vue 2D" : "Vue 3D"}
        </button>
      </div>
    </>
  );
}