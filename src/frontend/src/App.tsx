import { useState } from "react";
import { useChessGame } from "./hooks/useChessGame";
import { useAuth } from "./contexts/AuthContext";

// Composants
import { ChessGame3D } from "./components/ChessGame3D";
import { ChessGame2D } from "./components/ChessGame2D";
import { FloatingPiece } from "./components/FloatingPiece";
import { AnimatedPiece } from "./components/AnimatedPiece";
import { MoveHistory } from "./components/MoveHistory";
import { ProfileButton } from "./components/ProfileButton";
import { Login } from "./components/Login";
import { FindGameButton } from "./components/FindGameButton";

// Assets & Styles
import connexionLogo from "./assets/Logo/login.svg";
import "./styles/App.css";
import "./styles/Buttons.css";

export default function App() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [is3D, setIs3D] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocalGame, setIsLocalGame] = useState(false);

  // 💡 Fusion des deux hooks useChessGame (Récupération des animations + fonctions de drag)
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
  } = useChessGame();

  const currentHistory = game.history();

  // 1️⃣ SÉCURITÉ : Pendant que /me charge au démarrage, on affiche un écran d'attente
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner">Chargement de ChessGuard...</div>
      </div>
    );
  }

  // États du match
  const isInActiveGame = isLocalGame || !!user?.currentGame?.id;
  const isOnlineWhite = user?.username === user?.currentGame?.player1?.username;
  const playerColor: 'white' | 'black' = isLocalGame || isOnlineWhite ? 'white' : 'black';

  console.log(`[ChessGuard] Connecté en tant que : ${user?.username} | Couleur : ${playerColor}`);

  return (
    <div className={`app ${is3D ? "app-3d" : ""}`}>
      
      {/* HEADER : Connexion / Profil */}
      {isAuthenticated ? (
        <ProfileButton />
      ) : (
        <button className="connexion-button" onClick={() => setIsLoginOpen(true)}>
          <img src={connexionLogo} alt="connexion" className="connexion-logo" />
          <span className="connexion-label">Connexion</span>
        </button>
      )}

      {/* RENDER PRINCIPAL */}
      {isInActiveGame ? (
        /* VUE ÉCHIQUIER (En match) */
        <div className="game-container">
          <div className="chessboard-wrapper">
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
                playerColor={playerColor}
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
                playerColor={playerColor}
              />
            )}
          </div>
          
          {/* Historique des coups avec les pseudos réels */}
          <MoveHistory 
            history={currentHistory} 
            player1Name={isLocalGame ? "Blancs (Local)" : (user?.currentGame?.player1?.username || "Chargement...")}
            player2Name={isLocalGame ? "Noirs (Local)" : (user?.currentGame?.player2?.username || "Chargement...")}
          />
        </div>
      ) : (
        /* VUE LOBBY / ACCUEIL (Hors match) */
        <div className="lobby-container">
          <h1 className="title-chess">
            CHESS <span className="title-guard">GUARD</span>
          </h1>
          <p className="subtitle-chess-guard">Jouer en local ou en ligne</p>

          <div className="lobby-actions">
            {isAuthenticated ? (
              <FindGameButton />
            ) : (
              <p className="login-prompt">Connectez-vous pour défier des joueurs en ligne.</p>
            )}
            
            <button onClick={() => setIsLocalGame(true)} className="button-local-game">
              Jouer en local
            </button>
          </div>
        </div>
      )}

      {/* Éléments overlay pour les animations fluides de ton pote */}
      <FloatingPiece dragPiece={dragPiece} game={game} />

      {animatingPiece && (
        <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />
      )}

      {/* ACTIONS COMPLÉMENTAIRES (Uniquement en match) */}
      {isInActiveGame && (
        <div className="game-actions">
          {isLocalGame && (
            <button onClick={() => setIsLocalGame(false)} className="button-leave-game">
              Quitter la partie locale
            </button>
          )}
          <button onClick={() => setIs3D(!is3D)} className="button-switch-2d-3d">
            {is3D ? "Vue 2D" : "Vue 3D"}
          </button>
        </div>
      )}

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}