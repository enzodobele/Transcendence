// src/frontend/src/App.tsx
import { useState, useEffect, useRef } from "react";
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
import { ChessGame3D } from "./components/ChessGame3D"; // 🚀 Importé ici pour le Lobby !

// Assets
import connexionLogo from "./assets/Logo/login.svg";

export default function App() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocalGame, setIsLocalGame] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false); // 🚀 État pour le menu des modes
  const [is3D, setIs3D] = useState(false); // 🚀 Remonté ici pour être contrôlé depuis le header
  
  // ⏱️ États pour piloter l'interaction avec le mode démo du lobby
  const [isDemoMode, setIsDemoMode] = useState(true);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // 🔄 Coupe la démo et gère le coup (Reçoit optionnellement la case cliquée)
  const handleLobbyInteraction = (square?: string) => {
    if (isDemoMode) {
      setIsDemoMode(false); // Arrête proprement la rotation cinématique
    }

    // On efface le précédent chrono
    if (demoTimeoutRef.current) {
      clearTimeout(demoTimeoutRef.current);
    }

    // On lance le compte à rebours d'une minute d'inactivité
    demoTimeoutRef.current = setTimeout(() => {
      setIsDemoMode(true);
    }, 3000);

    // Si on a cliqué sur une case 3D valide, on joue le coup en activant le bypass du tour
    if (square) {
      handleSquareClick(square, true);
    }
  };

  // Sécurité : On nettoie le timeout si le composant est démonté
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
      {/* HEADER ACTIONS : Connexion/Profil à gauche, Actions à droite */}
      <div className="app-header">
        <div className="header-left">
          {isAuthenticated ? <ProfileButton /> : (
            <button className="connexion-button" onClick={() => setIsLoginOpen(true)}>
              <img src={connexionLogo} alt="connexion" className="connexion-logo" />
              <span>Connexion</span>
            </button>
          )}
        </div>

        <div className="header-right">
          {/* 🔄 Conditionnelle : Switch VUE en jeu, Menu de recherche au Lobby */}
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
          is3D={is3D} // 🚀 Transmis à la vue
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
          
          {/* ♟️ Vitrine 3D animée au milieu du lobby */}
          {/* Le onClick ici intercepte n'importe quel geste de caméra pour couper la rotation */}
          <div className="lobby-chessboard-preview" onClick={() => handleLobbyInteraction()}>
            <ChessGame3D
              game={game}
              board={board}
              selected={selected}
              capturedPieces={capturedPieces}
              pendingPromotion={!!pendingPromotion}
              onSquareClick={(square) => handleLobbyInteraction(square)} /* 🚀 Transmet la case à notre intercepteur */
              onResetGame={resetGame}
              onPromotionChoice={handlePromotionChoice}
              isDemoMode={isDemoMode}
            />
          </div>

          <div className="lobby-actions">
            {!isAuthenticated && (
              <>
                <p className="login-prompt">Connectez-vous pour défier des joueurs en ligne.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* 📋 Modale de sélection des modes de jeu */}
      {showModeMenu && (
        <div className="modal-overlay" onClick={() => setShowModeMenu(false)}>
          <div className="modes-menu-content" onClick={(e) => e.stopPropagation()}>
            <h2>Choisir un mode de jeu</h2>
            <button onClick={() => { /* Ta logique de matchmaking existante */ setShowModeMenu(false); }} className="menu-mode-btn">🌐 En ligne</button>
            <button onClick={() => alert("IA en cours d'implémentation...")} className="menu-mode-btn">🤖 Entraînement</button>
            <button onClick={() => alert("Duel ami en cours d'implémentation...")} className="menu-mode-btn">⚔️ Duel</button>
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