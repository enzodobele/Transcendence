// src/frontend/src/App.tsx
import { useState } from "react";
import { useChessGame } from "./hooks/chess/useChessGame";
import { useAuth } from "./contexts/AuthContext";
import { useGameWebSocket } from "./hooks/chess/useGameWebSocket";

// 🚀 L'unique import CSS qui contient tout ton écosystème graphique
import "./styles/main.css";

// Composants
import { GameView } from "./components/GameView";
import { FloatingPiece } from "./components/FloatingPiece";
import { AnimatedPiece } from "./components/AnimatedPiece";
import { ProfileButton } from "./components/ProfileButton";
import { Login } from "./components/Login";
import { FindGameButton } from "./components/FindGameButton";

// Assets
import connexionLogo from "./assets/Logo/login.svg";

export default function App() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocalGame, setIsLocalGame] = useState(false);

  // Calculs des configurations
  const isInActiveGame = isLocalGame || !!user?.currentGame?.id;
  const isOnlineWhite = user?.username === user?.currentGame?.player1?.username;
  const playerColor: "white" | "black" = isLocalGame || isOnlineWhite ? "white" : "black";

  let triggerServerMove = (moveData: any) => {};

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
    makeMove,
    syncWithServerFen,
    customHistory,
  } = useChessGame(playerColor, (move) => triggerServerMove(move));

  const { sendMoveToServer } = useGameWebSocket({
    token,
    gameId: user?.currentGame?.id,
    isLocalGame,
    syncWithServerFen,
    makeMove,
  });

  triggerServerMove = sendMoveToServer;

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner">Chargement de ChessGuard...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* HEADER : Connexion / Profil */}
      {isAuthenticated ? <ProfileButton /> : (
        <button className="connexion-button" onClick={() => setIsLoginOpen(true)}>
          <img src={connexionLogo} alt="connexion" className="connexion-logo" />
          <span className="connexion-label">Connexion</span>
        </button>
      )}

      {/* RENDER PRINCIPAL : Match ou Lobby */}
      {isInActiveGame ? (
        <GameView
          game={game}
          board={board}
          selected={selected}
          lastMove={lastMove}
          dragPiece={dragPiece}
          animatingPiece={animatingPiece}
          capturedPieces={capturedPieces}
          pendingPromotion={pendingPromotion}
          customHistory={customHistory}
          playerColor={playerColor}
          isLocalGame={isLocalGame}
          userUsername={user?.currentGame?.player1?.username}
          opponentUsername={user?.currentGame?.player2?.username}
          onSquareClick={handleSquareClick}
          onPiecePointerDown={handlePiecePointerDown}
          onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice}
          onLeaveLocalGame={() => setIsLocalGame(false)}
        />
      ) : (
        <div className="lobby-container">
          <h1 className="title-chess">CHESS <span className="title-guard">GUARD</span></h1>
          <p className="subtitle-chess-guard">Jouer en local ou en ligne</p>
          <div className="lobby-actions">
            {isAuthenticated ? <FindGameButton /> : (
              <p className="login-prompt">Connectez-vous pour défier des joueurs en ligne.</p>
            )}
            <button onClick={() => setIsLocalGame(true)} className="button-local-game">
              Jouer en local
            </button>
          </div>
        </div>
      )}

      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}