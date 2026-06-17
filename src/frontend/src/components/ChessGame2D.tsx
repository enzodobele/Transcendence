import { Board } from "./Board";
import { PromotionDialog } from "./PromotionDialog";
import connexionLogo from "../assets/Logo/login.svg";
import { Login } from "./Login";
import { ProfileButton } from "./ProfileButton";
import { useAuth } from "../contexts/AuthContext";

interface ChessGame2DProps {
  game: any;
  board: any;
  selected: any;
  lastMove: any;
  isDragging: boolean;
  pendingPromotion: boolean;
  isLoginOpen: boolean;
  onSquareClick: (square: string) => void;
  onDragStart: (e: React.DragEvent, piece: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, square: string) => void;
  onDragEnd: () => void;
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
  onLoginOpen: (open: boolean) => void;
}

export function ChessGame2D({
  game,
  board,
  selected,
  lastMove,
  isDragging,
  pendingPromotion,
  isLoginOpen,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResetGame,
  onPromotionChoice,
  onLoginOpen,
}: ChessGame2DProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="Board">
      <Board
        board={board}
        game={game}
        selected={selected}
        lastMove={lastMove}
        isDragging={isDragging}
        onSquareClick={onSquareClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      />

      {isAuthenticated ? (
        <ProfileButton />
      ) : (
        <button
          className="connexion-button"
          onClick={() => onLoginOpen(true)}
        >
          <img
            src={connexionLogo}
            alt="connexion"
            className="connexion-logo"
          />
          Connexion
        </button>
      )}

      <Login isOpen={isLoginOpen} onClose={() => onLoginOpen(false)} />

      <button onClick={onResetGame} className="reset-board">
        Réinitialiser
      </button>

      {pendingPromotion && (
        <PromotionDialog
          onChoose={onPromotionChoice}
          playerColor={game.turn() === "w" ? "b" : "w"}
        />
      )}
    </div>
  );
}
