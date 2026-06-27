import { useState, useEffect, useRef } from "react";
import { useChessGame } from "./hooks/chess/useChessGame";
import { useAuth } from "./contexts/AuthContext";
import { useGameWebSocket } from "./hooks/chess/useGameWebSocket";

// 🚀 Styles globaux (qui contiennent le moule de hauteur à 2.1rem)
import "./styles/main.css";

// Composants
import { GameView } from "./components/Board/GameView";
import { FloatingPiece } from "./components/Board/FloatingPiece";
import { AnimatedPiece } from "./components/Board/AnimatedPiece";
import { ChessGame3D } from "./components/Board/ChessGame3D";

import { LoginButton } from "./components/Login/LoginButton"; // 🌟 Gère son propre overlay en interne désormais
import { ProfileButton } from "./components/Profile/ProfileButton";
import { FindGameButton } from "./components/FindGame/FindGameButton";
import { Switch3DButton } from "./components/Board/Switch3DButton";

export default function App() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
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
      {/* 🌟 ZONE DES BOUTONS DE NAVIGATION ABSOLUS */}
      {/* Coin haut droit : Authentification */}
      {isAuthenticated ? (
        <ProfileButton />
      ) : (
        <LoginButton /> 
      )}

      {/* Coin haut gauche : Actions de jeu interchangées automatiquement */}
      {isInActiveGame ? (
        <Switch3DButton is3D={is3D} setIs3D={setIs3D} />
      ) : (
        isAuthenticated && <FindGameButton />
      )}

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
      
      {/* 🌟 L'ancien composant <Login /> en bas a été supprimé puisqu'il vit maintenant dans LoginButton.tsx */}
    </div>
  );
}