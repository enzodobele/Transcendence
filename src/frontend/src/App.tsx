import { useState } from "react";
import { useTranslation } from "react-i18next";
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
import { LanguageSwitcher } from "./components/LanguageSwitcher/LanguageSwitcher";
import { LegalLinks } from "./components/Legal/LegalLinks";

export default function App() {
  const { t } = useTranslation();
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

  // 2. Logique du Matchmaking & Sélection du Mode
  const [isFindGameOpen, setIsFindGameOpen] = useState(false);
  const { isSearching, error: findGameError, startSearch, cancelSearch } = useFindGame();
  const [selectedMode, setSelectedMode] = useState<SelectedGameMode>({
    id: "local",
    label: t("findGame.modes.local.title"),
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
        startSearch();
        break;
      case "duel":
        alert(t("findGame.inviteComingSoon"));
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
        <div className="spinner">{t("common.loading")}</div>
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

      {/* 🟢 Overlay d'attente et de sélection combiné */}
      <FindGameOverlay
        isOpen={isFindGameOpen || isSearching}
        onClose={() => {
          if (!isSearching) setIsFindGameOpen(false);
        }}
        isSearching={isSearching}
        onCancelMatchmaking={() => {
          cancelSearch();
          setIsFindGameOpen(false);
        }}
        onModeSelected={(mode: SelectedGameMode) => {
          setSelectedMode(mode);
          setIsFindGameOpen(false);
        }}
      />

      {/* Rendu principal : GameView et LobbyView restent tous les deux montés en
          permanence pour éviter de recréer leurs contextes WebGL (Canvas 3D) à
          chaque aller-retour lobby/partie ; seule la visibilité CSS bascule. */}
      <div style={{ display: isInActiveGame ? "contents" : "none" }}>
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
          active={isInActiveGame}
        />
      </div>

      <div style={{ display: isInActiveGame ? "none" : "contents" }}>
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
          active={!isInActiveGame}
        />

        <div className="lobby-actions">
          {isAuthenticated && (
            <>
              {findGameError && <p className="lobby-error">{findGameError}</p>}
              <PlayButton
                label={selectedMode.id === "matchmaking" ? t("findGame.findOpponent") : selectedMode.label}
                onClick={runSelectedMode}
              />
              <LanguageSwitcher />
              <LegalLinks />
            </>
          )}
        </div>
      </div>

      {/* Éléments Flottants & Overlays de déconnexion */}
      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}

      <DisconnectionOverlay
        isOpen={isOpponentDisconnected}
        initialSeconds={disconnectTimeout}
        onClaimVictory={sendClaimVictory}
      />

    </div>
  );
}