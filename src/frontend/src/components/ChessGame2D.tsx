import { Board } from "./Board";
import "../styles/ChessGame2D.css";
import { PromotionDialog } from "./PromotionDialog";

interface ChessGame2DProps {
  game: any;
  board: any;
  selected: any;
  lastMove: any;
  isDragging: boolean;
  pendingPromotion: boolean;
  onSquareClick: (square: string) => void;
  onDragStart: (e: string, piece: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: string, square: React.DragEvent<Element>) => void;
  onDragEnd: () => void;
  onResetGame: () => void;
  onPromotionChoice: (piece: string) => void;
  playerColor: 'white' | 'black';
}

export function ChessGame2D({
  game,
  board,
  selected,
  lastMove,
  isDragging,
  pendingPromotion,
  onSquareClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResetGame,
  onPromotionChoice,
  playerColor,
}: ChessGame2DProps) {
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
		playerColor={playerColor}
      />

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
