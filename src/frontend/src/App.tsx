import { useState } from "react";
import { useChessGame } from "./hooks/useChessGame";
import { ChessGame3D } from "./components/ChessGame3D";
import { ChessGame2D } from "./components/ChessGame2D";
import "./App.css";

export default function App() {
  const {
    game,
    board,
    selected,
    handleSquareClick,
    resetGame,
    lastMove,
    isDragging,
    setIsDragging,
    handleDragStart,
    handleDragOver,
    handleDrop,
    capturedPieces,
    pendingPromotion,
    handlePromotionChoice,
  } = useChessGame();

  const [is3D, setIs3D] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="app">
      {is3D ? (
        <ChessGame3D
          game={game}
          board={board}
          selected={selected}
          capturedPieces={capturedPieces}
          pendingPromotion={!!pendingPromotion}
          onSquareClick={handleSquareClick}
          onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice}
        />
      ) : (
        <ChessGame2D
          game={game}
          board={board}
          selected={selected}
          lastMove={lastMove}
          isDragging={isDragging}
          pendingPromotion={!!pendingPromotion}
          isLoginOpen={isLoginOpen}
          onSquareClick={handleSquareClick}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={() => setIsDragging(false)}
          onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice}
          onLoginOpen={setIsLoginOpen}
        />
      )}
      <div>
       <h1 className="title-chess">
        CHESS <span className="title-guard">GUARD</span>
      </h1>

      <p className="subtitle-chess-guard">Jouer en local ou en ligne</p>
      </div>

      <button className="button-find-game">Chercher une partie</button>
      <button
        onClick={() => setIs3D(!is3D)}
        className="button-switch-2d-3d"
      >
        {is3D ? "Vue 2D" : "Vue 3D"}
      </button>
    </div>
  );
}