import { useState, useEffect, useRef } from "react";
import { useChessGame } from "./hooks/chess/useChessGame";
import { useAuth } from "./contexts/AuthContext";
import { useGameWebSocket } from "./hooks/chess/useGameWebSocket";

// 🚀 Styles globaux (qui contiennent le moule de hauteur à 2.1rem)
import "./styles/main.css";

// Composants
import { GameView } from "./components/GameView";
import { FloatingPiece } from "./components/FloatingPiece";
import { AnimatedPiece } from "./components/AnimatedPiece";
import { ProfileButton } from "./components/Profile/ProfileButton";
import { LoginButton } from "./components/Login/LoginButton"; // 🌟 Ajouté
import { Login } from "./components/Login/LoginOverlay";
import { ChessGame3D } from "./components/ChessGame3D";

export default function App() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocalGame, setIsLocalGame] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [is3D, setIs3D] = useState(false);
  
  const [isDemoMode, setIsDemoMode] = useState(true);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isInActiveGame = isLocalGame || !!user?.currentGame?.id;
  const isOnlineWhite = user?.username === user?.currentGame?.player1?.username;
  const playerColor: "white" | "black" = isLocalGame || isOnlineWhite ? "white" : "black";

  let triggerServerMove = (moveData: any) => {};

  const {
    game, board, selected, lastMove, dragPiece, animatingPiece, clearAnimation,
    handleSquareClick, handlePiecePointerDown, resetGame, capturedPieces,
    pendingPromotion, handlePromotionChoice, makeMove, syncWithServerFen, customHistory,
  } = useChessGame(playerColor, (move) => triggerServerMove(move));

  const { sendMoveToServer } = useGameWebSocket({
    token, gameId: user?.currentGame?.id, isLocalGame, syncWithServerFen, makeMove,
  });

  triggerServerMove = sendMoveToServer;

  const handleLobbyInteraction = (square?: string) => {
    if (isDemoMode) setIsDemoMode(false);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    demoTimeoutRef.current = setTimeout(() => setIsDemoMode(true), 3000);

    if (square) handleSquareClick(square, true);
  };

  useEffect(() => {
    return () => {
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner">Chargement de ChessGuard...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* HEADER ACTIONS */}
      <div className="app-header">
        <div className="header-left">
          {/* 🌟 Intégration modulaire propre et unifiée */}
          {isAuthenticated ? (
            <ProfileButton />
          ) : (
            <LoginButton onClick={() => setIsLoginOpen(true)} />
          )}
        </div>

        <div className="header-right">
          {isInActiveGame ? (
            <button onClick={() => setIs3D(!is3D)} className="button-switch-2d-3d">
              {is3D ? "Vue 2D" : "Vue 3D"}
            </button>
          ) : (
            isAuthenticated && (
              <button onClick={() => setShowModeMenu(true)} className="button-find-game">
                Chercher une partie
              </button>
            )
          )}
        </div>
      </div>

      {/* RENDER PRINCIPAL */}
      {isInActiveGame ? (
        <GameView
          game={game} board={board} selected={selected} lastMove={lastMove}
          dragPiece={dragPiece} animatingPiece={animatingPiece} capturedPieces={capturedPieces}
          pendingPromotion={pendingPromotion} customHistory={customHistory} playerColor={playerColor}
          isLocalGame={isLocalGame} is3D={is3D} userUsername={user?.currentGame?.player1?.username}
          opponentUsername={user?.currentGame?.player2?.username} onSquareClick={handleSquareClick}
          onPiecePointerDown={handlePiecePointerDown} onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice} onLeaveLocalGame={() => setIsLocalGame(false)}
        />
      ) : (
        <div className="lobby-container">
          <h1 className="title-chess">CHESS <span className="title-guard">GUARD</span></h1>
          <p className="subtitle-chess-guard">Jouer en local ou en ligne</p>
          
          <div className="lobby-chessboard-preview" onClick={() => handleLobbyInteraction()}>
            <ChessGame3D
              game={game} board={board} selected={selected} capturedPieces={capturedPieces}
              pendingPromotion={!!pendingPromotion} onSquareClick={(square) => handleLobbyInteraction(square)}
              onResetGame={resetGame} onPromotionChoice={handlePromotionChoice} isDemoMode={isDemoMode}
            />
          </div>

          <div className="lobby-actions">
            {!isAuthenticated && (
              <p className="login-prompt">Connectez-vous pour défier des joueurs en ligne.</p>
            )}
          </div>
        </div>
      )}

      {/* MODALE DE SÉLECTION */}
      {showModeMenu && (
        <div className="modal-overlay" onClick={() => setShowModeMenu(false)}>
          <div className="modes-menu-content" onClick={(e) => e.stopPropagation()}>
            <h2>Choisir un mode de jeu</h2>
            <button onClick={() => setShowModeMenu(false)} className="menu-mode-btn">🌐 En ligne</button>
            <button onClick={() => alert("IA en cours...")} className="menu-mode-btn">🤖 Entraînement</button>
            <button onClick={() => alert("Duel...")} className="menu-mode-btn">⚔️ Duel</button>
            <button onClick={() => { setIsLocalGame(true); setShowModeMenu(false); }} className="menu-mode-btn">🖥️ Libre / Local</button>
            <button onClick={() => setShowModeMenu(false)} className="menu-close-btn">Fermer</button>
          </div>
        </div>
      )}

      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}
      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}