import { useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useGameLogic } from "./hooks/chess/useGameLogic";
import { useFindGame } from "./hooks/useFindGame";

import "./styles/main.css";

import { GameView } from "./components/Board/GameView";
import { FloatingPiece } from "./components/Board/FloatingPiece";
import { AnimatedPiece } from "./components/Board/AnimatedPiece";
import { LobbyView } from "./components/LobbyView";
import { DisconnectionOverlay } from "./components/Disconnect/DisconnectOverlay";

import { LoginButton } from "./components/Login/LoginButton";
import { ProfileButton } from "./components/Profile/ProfileButton";
import { FindGameButton } from "./components/FindGame/FindGameButton";
import { FindGameOverlay, type SelectedGameMode } from "./components/FindGame/FindGameOverlay";
import { PlayButton } from "./components/Play/PlayButton";
import { Switch3DButton } from "./components/Board/Switch3DButton";
import { LegalLinks } from "./components/Legal/LegalLinks";

export default function App() {
  const { isAuthenticated, isLoading, user, token, refreshUserStatus } = useAuth();

  // 1. Logique unifiée du jeu d'échecs (Hook propre)
  const {
    isLocalGame, isAIGame, isAIvsAI, is3D, setIs3D,
    customGameOver, drawOfferPending, isInActiveGame, playerColor,
    game, board, selected, lastMove, dragPiece, animatingPiece, clearAnimation,
    capturedPieces, pendingPromotion, customHistory,
    isOpponentDisconnected, disconnectTimeout,
    
    handleSquareClick, handlePiecePointerDown, handlePromotionChoice,
    handleReturnToMenu, handleStartAiGame, handleStartCustomAI, handleStartAIvsAI,
    handleStartLocalGame, handleResign, handleOfferDraw, handleDrawAccept,
    handleDrawRefuse, handleResetGame, sendClaimVictory
  } = useGameLogic({ user, token, refreshUserStatus });

  // 2. Logique du Matchmaking & Sélection du Mode
  const [isFindGameOpen, setIsFindGameOpen] = useState(false);
  const { isSearching, error: findGameError, startSearch, cancelSearch } = useFindGame();
  const [selectedMode, setSelectedMode] = useState<SelectedGameMode>({
    id: "local",
    label: "Partie Libre",
  });

  // 3. Déclencheur du bouton d'action principal
  const runSelectedMode = () => {
    switch (selectedMode.id) {
      case "ai":
        handleStartAiGame(selectedMode.difficulty ?? 3);
        break;
      case "custom-ai":
        handleStartCustomAI();
        break;
      case "ai-vs-ai":
        handleStartAIvsAI(selectedMode.difficulty ?? 3);
        break;
      case "matchmaking":
        setIsFindGameOpen(true);
        startSearch();
        break;
      case "duel":
        alert("Lien d'invitation bientôt dispo ! (En attente du backend)");
        break;
      case "local":
      default:
        handleStartLocalGame();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner">Chargement de ChessGuard...</div>
      </div>
    );
  }

  const gameIsOver = !!(customGameOver || game.isGameOver());

  return (
    <div className={`app${is3D && isInActiveGame ? " app-3d" : ""}`}>
      {/* Profil / Connexion */}
      {isAuthenticated ? <ProfileButton /> : <LoginButton />}

      {/* Menu Haut : Switch 3D si en jeu, sinon choix de mode */}
      {isInActiveGame && !gameIsOver ? (
        <Switch3DButton is3D={is3D} setIs3D={setIs3D} />
      ) : (
        isAuthenticated && <FindGameButton onClick={() => setIsFindGameOpen(true)} />
      )}

      {/* Overlay de gestion des modes */}
      <FindGameOverlay
        isOpen={isFindGameOpen}
        onClose={() => setIsFindGameOpen(false)}
        isSearching={isSearching}
        onCancelMatchmaking={cancelSearch}
        onModeSelected={setSelectedMode}
      />

      {/* Rendu principal */}
      {isInActiveGame ? (
        <GameView
          game={game} board={board} selected={selected} lastMove={lastMove}
          dragPiece={dragPiece} animatingPiece={animatingPiece} capturedPieces={capturedPieces}
          pendingPromotion={pendingPromotion} customHistory={customHistory} playerColor={playerColor}
          isLocalGame={isLocalGame} isAIGame={isAIGame} is3D={is3D} customGameOver={customGameOver}
          drawOfferPending={drawOfferPending}
          userUsername={user?.currentGame?.player1?.username}
          opponentUsername={user?.currentGame?.player2?.username}
          onSquareClick={isAIvsAI ? () => {} : handleSquareClick}
          onPiecePointerDown={handlePiecePointerDown}
          onResetGame={handleResetGame}
          onPromotionChoice={handlePromotionChoice}
          onLeaveLocalGame={handleReturnToMenu}
          onReturnToMenu={handleReturnToMenu}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          onDrawAccept={handleDrawAccept}
          onDrawRefuse={handleDrawRefuse}
        />
      ) : (
<>
    <LobbyView
      isAuthenticated={isAuthenticated}
      game={game} 
      board={board} 
      selected={selected}
      capturedPieces={capturedPieces} 
      pendingPromotion={pendingPromotion}
      resetGame={handleResetGame} 
      handlePromotionChoice={handlePromotionChoice}
      handleSquareClick={handleSquareClick}
    /> 

    <div className="lobby-actions">
		{isAuthenticated && (
			<>
			{findGameError && <p className="lobby-error">{findGameError}</p>}
			<PlayButton label={selectedMode.label} onClick={runSelectedMode} />
			</>
		)}
	</div>
	</>
	)}

      {/* Éléments Flottants & Overlays de déconnexion */}
      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}

      <DisconnectionOverlay
        isOpen={isOpponentDisconnected}
        initialSeconds={disconnectTimeout}
        onClaimVictory={sendClaimVictory}
      />

      {/* Footer Légal global */}
      <LegalLinks />
    </div>
  );
}