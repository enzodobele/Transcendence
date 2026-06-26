import { useState } from "react";
import { useChessGame } from "./hooks/useChessGame";
import { ChessGame3D } from "./components/ChessGame3D";
import { ChessGame2D } from "./components/ChessGame2D";
import { FloatingPiece } from "./components/FloatingPiece";
import { AnimatedPiece } from "./components/AnimatedPiece";
import { ProfileButton } from "./components/ProfileButton";
import { Login } from "./components/Login";
import { useAuth } from "./contexts/AuthContext";
import connexionLogo from "./assets/Logo/login.svg";
import { AIControls } from "./components/AIControls";
import "./App.css";

export default function App() {
  const [isAIMode, setIsAIMode] = useState(false);
  const [difficulty, setDifficulty] = useState(3);
  const {
    game,
    board,
    selected,
    lastMove,
    dragPiece,
    animatingPiece,
    clearAnimation,
    handleSquareClick,
    handlePiecePointerDown,
    resetGame,
    capturedPieces,
    pendingPromotion,
    handlePromotionChoice,
  } = useChessGame({ isAIMode, difficulty });
  const { isAuthenticated } = useAuth();
  const [is3D, setIs3D] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);


  return (
    <div className={`app ${is3D ? "app-3d" : ""}`}>
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
          dragSquare={dragPiece?.square ?? null}
          animatingToSquare={animatingPiece?.toSquare ?? null}
          pendingPromotion={!!pendingPromotion}
          onSquareClick={handleSquareClick}
          onPiecePointerDown={handlePiecePointerDown}
          onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice}
        />
      )}

      <FloatingPiece dragPiece={dragPiece} game={game} />

      {animatingPiece && (
        <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />
      )}

      {isAuthenticated ? (
        <ProfileButton />
      ) : (
        <button
          className="connexion-button"
          onClick={() => setIsLoginOpen(true)}
        >
          <img
            src={connexionLogo}
            alt="connexion"
            className="connexion-logo"
          />
          <span className="connexion-label">Connexion</span>
        </button>
      )}

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      <div className="game-actions">
        <button className="button-find-game">Chercher une partie</button>
        <AIControls
          isAIMode={isAIMode}
          difficulty={difficulty}
          onToggleAI={() => setIsAIMode(!isAIMode)}
          onDifficultyChange={setDifficulty}
        />
        <button onClick={() => setIs3D(!is3D)} className="button-switch-2d-3d">
          {is3D ? "Vue 2D" : "Vue 3D"}
        </button>
      </div>

      {!is3D && (
        <>
          <h1 className="title-chess">
            CHESS <span className="title-guard">GUARD</span>
          </h1>
          <p className="subtitle-chess-guard">Jouer en local ou en ligne</p>
        </>
      )}
    </div>
  );
}
