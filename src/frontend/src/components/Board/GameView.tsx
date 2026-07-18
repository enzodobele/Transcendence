import { Flag, Handshake, LogOut, RotateCcw, Home, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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

function getGameOverMessage(game: any, t: (key: string) => string): string | null {
  if (!game.isGameOver()) return null;
  if (game.isCheckmate()) return game.turn() === "w" ? t("game.result.blackWins") : t("game.result.whiteWins");
  if (game.isStalemate()) return t("game.result.stalemate");
  if (game.isDraw()) return t("game.result.draw");
  return t("game.result.gameOver");
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
  const { t } = useTranslation();
  const gameOverMessage = customGameOver ?? getGameOverMessage(game, t);

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
              <Flag size={15} /> {t("game.resign")}
            </button>
            {!isAIGame && (
              <button onClick={onOfferDraw} className="button-leave-game">
                <Handshake size={15} /> {t("game.offerDraw")}
              </button>
            )}
          </div>
        )}
        {isLocalGame && (
          <button onClick={onLeaveLocalGame} className="button-leave-game">
            <LogOut size={15} /> {t("game.quitLocal")}
          </button>
        )}
      </div>

      {drawOfferPending && !gameOverMessage && (
        <div className="gameover-overlay">
          <div className="gameover-content">
            <p className="gameover-message">{t("game.drawOffered")}</p>
            <div className="gameover-draw-actions">
              <button className="gameover-replay-btn" onClick={onDrawAccept}>
                <Check size={15} /> {t("game.accept")}
              </button>
              <button className="gameover-refuse-btn" onClick={onDrawRefuse}>
                <X size={15} /> {t("game.refuse")}
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
                  <RotateCcw size={15} /> {t("game.replay")}
                </button>
              )}
              <button className="gameover-refuse-btn" onClick={onReturnToMenu}>
                <Home size={15} /> {t("game.mainMenu")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
