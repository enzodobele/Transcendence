import { ChessGame3D } from "./ChessGame3D";
import { ChessGame2D } from "./ChessGame2D";
import "../../styles/Board/GameOver.css";

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
  isAIGame: boolean;
  is3D: boolean;
  customGameOver?: string | null;
  drawOfferPending?: boolean;
  onSquareClick: (square: string) => void;
  onPiecePointerDown: (square: string, e: React.PointerEvent) => void;
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
  onLeaveLocalGame: () => void;
  onReturnToMenu: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onDrawAccept: () => void;
  onDrawRefuse: () => void;
}

function getGameOverMessage(game: any): string | null {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) return game.turn() === "w" ? "Les noirs gagnent !" : "Les blancs gagnent !";
  if (game.isStalemate()) return "Pat — Égalité !";
  if (game.isDraw()) return "Partie nulle !";
  return "Partie terminée";
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
  isAIGame,
  is3D,
  customGameOver,
  drawOfferPending,
  onSquareClick,
  onPiecePointerDown,
  onResetGame,
  onPromotionChoice,
  onLeaveLocalGame,
  onReturnToMenu,
  onResign,
  onOfferDraw,
  onDrawAccept,
  onDrawRefuse,
}: GameViewProps) {
  const gameOverMessage = customGameOver ?? getGameOverMessage(game);

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
        {!gameOverMessage && !isLocalGame && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={onResign} className="button-leave-game">
              Abandonner
            </button>
            {!isAIGame && (
              <button onClick={onOfferDraw} className="button-leave-game">
                Proposer la nulle
              </button>
            )}
          </div>
        )}
        {isLocalGame && (
          <button onClick={onLeaveLocalGame} className="button-leave-game">
            Quitter la partie locale
          </button>
        )}
      </div>

      {drawOfferPending && !gameOverMessage && (
        <div className="gameover-overlay">
          <div className="gameover-content">
            <p className="gameover-message">Nulle proposée</p>
            <div className="gameover-draw-actions">
              <button className="gameover-replay-btn" onClick={onDrawAccept}>
                Accepter
              </button>
              <button className="gameover-refuse-btn" onClick={onDrawRefuse}>
                Refuser
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOverMessage && (
        <div className="gameover-overlay">
          <div className="gameover-content">
            <p className="gameover-message">{gameOverMessage}</p>
            <div className="gameover-draw-actions">
              {isAIGame && (
                <button className="gameover-replay-btn" onClick={onResetGame}>
                  Rejouer
                </button>
              )}
              <button className="gameover-refuse-btn" onClick={onReturnToMenu}>
                Menu principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
