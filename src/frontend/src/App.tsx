import { Board } from "./components/Board";
import { ResetButton } from "./components/ResetButton";
import { useChessGame } from "./hooks/useChessGame";
import AuthSandbox from "./AuthSandbox"; // 1. Import de votre bac à sable

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
        flexDirection: "row", // 2. Aligne l'Auth et le Jeu côte à côte (mettez "column" pour superposer)
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "40px",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      {/* 3. Bloc d'Authentification temporaire */}
      <div style={{ marginTop: "60px" }}>
        <AuthSandbox />
      </div>

      {/* 4. Bloc Jeu d'échecs d'origine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
    </div>
  );
}