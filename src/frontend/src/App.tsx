import { useAuth } from "./contexts/AuthContext";
import { useGameLogic } from "./hooks/chess/useGameLogic";

import "./styles/main.css";

import { GameView } from "./components/Board/GameView";
import { FloatingPiece } from "./components/Board/FloatingPiece";
import { AnimatedPiece } from "./components/Board/AnimatedPiece";
import { LobbyView } from "./components/LobbyView";
import { DisconnectionOverlay } from "./components/Disconnect/DisconnectOverlay";

import { LoginButton } from "./components/Login/LoginButton";
import { ProfileButton } from "./components/Profile/ProfileButton";
import { FindGameButton } from "./components/FindGame/FindGameButton";
import { Switch3DButton } from "./components/Board/Switch3DButton";

export default function App() {
  const { isAuthenticated, isLoading, user, token, refreshUserStatus } = useAuth();

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

      {/* Boutons d'actions principaux */}
      {isInActiveGame && !gameIsOver ? (
        <Switch3DButton is3D={is3D} setIs3D={setIs3D} />
      ) : (
        isAuthenticated && (
          <FindGameButton
            onStartLocalGame={handleStartLocalGame}
            onStartAiGame={handleStartAiGame}
            onStartCustomAI={handleStartCustomAI}
            onStartAIvsAI={handleStartAIvsAI}
          />
        )
      )}

      {/* Rendu principal : Partie active OU Lobby d'accueil */}
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
        <LobbyView
          isAuthenticated={isAuthenticated}
          game={game} board={board} selected={selected}
          capturedPieces={capturedPieces} pendingPromotion={pendingPromotion}
          resetGame={handleResetGame} handlePromotionChoice={handlePromotionChoice}
          handleSquareClick={handleSquareClick}
        />
      )}

      {/* Éléments Flottants & Overlays */}
      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}

      {/* ⏱️ Overlay de déconnexion réseau de l'adversaire */}
      <DisconnectionOverlay
        isOpen={isOpponentDisconnected}
        initialSeconds={disconnectTimeout}
        onClaimVictory={sendClaimVictory}
      />
    </div>
  );
}