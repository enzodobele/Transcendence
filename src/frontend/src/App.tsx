import { Board } from "./components/Board";
import { ResetButton } from "./components/ResetButton";
import { useChessGame } from "./hooks/useChessGame";

export default function App() {
  const {
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
  } = useChessGame();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <h1>♔ Chess ♚</h1>

      <Board
        board={board}
        game={game}
        selected={selected}
        lastMove={lastMove}
        isDragging={isDragging}
        onSquareClick={handleSquareClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
        onDragEnd={() => setIsDragging(false)}
      />

      <ResetButton onClick={resetGame} />
    </div>
  );
}