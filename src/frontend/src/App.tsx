import { useState, useEffect, useRef } from "react";
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
  // 1️⃣ TOUS LES HOOKS RESTATENT SAGEMENT AU SOMMET
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [is3D, setIs3D] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLocalGame, setIsLocalGame] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // 2️⃣ CALCULS DES ÉTATS ET DE LA COULEUR
  const isInActiveGame = isLocalGame || !!user?.currentGame?.id;
  const isOnlineWhite = user?.username === user?.currentGame?.player1?.username;
  const playerColor: 'white' | 'black' = isLocalGame || isOnlineWhite ? 'white' : 'black';

  // 3️⃣ INTERCEPTIONS DES MOUVEMENTS LOCAUX ENVOYÉS VERS LE SERVEUR via Nginx
  const handleSendMoveToServer = (moveData: { from: string; to: string; promotion?: string }) => {
    if (isLocalGame) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "move",
          data: moveData,
        })
      );
    }
  };

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
  } = useChessGame(playerColor, handleSendMoveToServer);

  // 4️⃣ EFFET WEBSOCKET NETTOYÉ POUR PASSER PAR LE REVERSE PROXY NGINX
  useEffect(() => {
    if (isLocalGame || !user?.currentGame?.id || !token) return;

    const gameId = user.currentGame.id;
    
    // 🚀 Configuration de l'URL alignée avec ton Nginx (Port 443 SSL -> wss)
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // 💡 Note l'absence du port 3000, Nginx se charge du routage d'infrastructure !
    const wsUrl = `${protocol}//${window.location.hostname}/ws?token=${encodeURIComponent(token)}&gameId=${gameId}`;
    
    console.log(`[ChessGuard WS] Tentative de liaison proxy : ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => console.log(`[ChessGuard WS] Session établie sur le salon #${gameId}`);
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "sync":
            syncWithServerFen(message.fen);
            break;
          case "opponent_move":
            const { from, to, promotion } = message.move;
            makeMove(from, to, promotion, true); 
            break;
          case "error":
            console.error("[ChessGuard WS] Erreur Backend :", message.message);
            break;
        }
      } catch (err) {
        console.error("[ChessGuard WS] Erreur lors du parsing JSON :", err);
      }
    };

    ws.onerror = (error) => console.error("[ChessGuard WS] Erreur réseau proxy :", error);
    ws.onclose = (e) => console.log(`[ChessGuard WS] Connexion close (${e.code}) : ${e.reason}`);

    return () => {
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [user?.currentGame?.id, isLocalGame, token]);

  // 5️⃣ VÉRIFICATION DU CHARGEMENT INITIAL (Intervient réglementairement après les hooks)
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner">Chargement de ChessGuard...</div>
      </div>
    );
  }

  const currentHistory = game.history();

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
          
          <MoveHistory 
            history={currentHistory} 
            player1Name={isLocalGame ? "Blancs (Local)" : (user?.currentGame?.player1?.username || "Joueur 1")}
            player2Name={isLocalGame ? "Noirs (Local)" : (user?.currentGame?.player2?.username || "Joueur 2")}
          />
        </div>
      ) : (
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

      <FloatingPiece dragPiece={dragPiece} game={game} />

      {animatingPiece && (
        <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />
      )}

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