import { useState, useEffect, useRef } from "react";
import { useChessGame } from "./hooks/chess/useChessGame";
import { useAuth } from "./contexts/AuthContext";
import { useGameWebSocket } from "./hooks/chess/useGameWebSocket";
import { useStockfish } from "./hooks/useStockfish";
import { useChessAI } from "./hooks/useChessAI";

import "./styles/main.css";

import { GameView } from "./components/Board/GameView";
import { FloatingPiece } from "./components/Board/FloatingPiece";
import { AnimatedPiece } from "./components/Board/AnimatedPiece";
import { ChessGame3D } from "./components/Board/ChessGame3D";

import { LoginButton } from "./components/Login/LoginButton";
import { ProfileButton } from "./components/Profile/ProfileButton";
import { FindGameButton } from "./components/FindGame/FindGameButton";
import { Switch3DButton } from "./components/Board/Switch3DButton";

export default function App() {
  const { isAuthenticated, isLoading, user, token, refreshUserStatus } = useAuth();
  const [isLocalGame, setIsLocalGame] = useState(false);
  const [isAIGame, setIsAIGame] = useState(false);
  const [isCustomAI, setIsCustomAI] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [customGameOver, setCustomGameOver] = useState<string | null>(null);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [is3D, setIs3D] = useState(false);

  const [isGameViewActive, setIsGameViewActive] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | undefined>(undefined);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<"white" | "black">("white");

  const [isDemoMode, setIsDemoMode] = useState(true);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnlineGame = !isLocalGame && !isAIGame && isGameViewActive;
  const isInActiveGame = isLocalGame || isAIGame || isGameViewActive;
  const playerColor: "white" | "black" = isLocalGame || isAIGame ? "white" : onlinePlayerColor;

  let triggerServerMove = (_moveData: any) => {};

  const { requestMove: requestStockfishMove } = useStockfish((from, to, promotion) => {
    makeMove(from, to, promotion, true, true);
  });

  const { requestMove: requestCustomAIMove } = useChessAI((from, to, promotion) => {
    makeMove(from, to, promotion, true, true);
  });

  const {
    game, board, selected, lastMove, dragPiece, animatingPiece, clearAnimation,
    handleSquareClick, handlePiecePointerDown, resetGame, capturedPieces,
    pendingPromotion, handlePromotionChoice, makeMove, syncWithServerFen, customHistory,
  } = useChessGame(playerColor, (move) => {
    triggerServerMove(move);
    if (isAIGame) {
      if (isCustomAI) requestCustomAIMove(game.fen());
      else requestStockfishMove(game.fen(), aiDifficulty);
    }
  }, isLocalGame);

  const { sendMoveToServer, sendResign, sendDrawOffer, sendDrawAccept, sendDrawRefuse } = useGameWebSocket({
    token,
    gameId: activeGameId,
    isLocalGame,
    syncWithServerFen,
    makeMove,
    onGameOver: (reason, winnerColor) => {
      setCustomGameOver(
        reason === "resign"
          ? winnerColor === "white" ? "Les blancs gagnent !" : "Les noirs gagnent !"
          : "Partie nulle !"
      );
      refreshUserStatus();
    },
    onDrawOffer: () => setDrawOfferPending(true),
    onDrawRefused: () => alert("La nulle a été refusée."),
  });

  triggerServerMove = sendMoveToServer;

  useEffect(() => {
    if (user?.currentGame?.id) {
      setActiveGameId(user.currentGame.id);
      setOnlinePlayerColor(
        user.username === user.currentGame.player1?.username ? "white" : "black"
      );
      setIsGameViewActive(true);
      setCustomGameOver(null);
      setDrawOfferPending(false);
      resetGame();
    }
  }, [user?.currentGame?.id]);

  const handleReturnToMenu = () => {
    setIsGameViewActive(false);
    setActiveGameId(undefined);
    setIsLocalGame(false);
    setIsAIGame(false);
    setIsCustomAI(false);
    setCustomGameOver(null);
    setDrawOfferPending(false);
    resetGame();
  };

  const handleStartAiGame = (difficulty: number) => {
    handleReturnToMenu();
    setAiDifficulty(difficulty);
    setIsCustomAI(false);
    setIsAIGame(true);
  };

  const handleStartCustomAI = () => {
    handleReturnToMenu();
    setIsCustomAI(true);
    setIsAIGame(true);
  };

  const handleStartLocalGame = () => {
    handleReturnToMenu();
    setIsLocalGame(true);
  };

  const handleResign = () => {
    if (isOnlineGame) sendResign();
    else setCustomGameOver(playerColor === "white" ? "Les noirs gagnent !" : "Les blancs gagnent !");
  };

  const handleOfferDraw = () => {
    if (isOnlineGame) sendDrawOffer();
    else setCustomGameOver("Partie nulle !");
  };

  const handleDrawAccept = () => { setDrawOfferPending(false); sendDrawAccept(); };
  const handleDrawRefuse = () => { setDrawOfferPending(false); sendDrawRefuse(); };
  const handleResetGame = () => { resetGame(); setCustomGameOver(null); };

  const handleLobbyInteraction = (square?: string) => {
    if (isDemoMode) setIsDemoMode(false);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
    demoTimeoutRef.current = setTimeout(() => setIsDemoMode(true), 3000);
    if (square) handleSquareClick(square, true);
  };

  useEffect(() => {
    return () => { if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current); };
  }, []);

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
      {isAuthenticated ? <ProfileButton /> : <LoginButton />}

      {isInActiveGame && !gameIsOver ? (
        <Switch3DButton is3D={is3D} setIs3D={setIs3D} />
      ) : (
        isAuthenticated && <FindGameButton
          onStartLocalGame={handleStartLocalGame}
          onStartAiGame={handleStartAiGame}
          onStartCustomAI={handleStartCustomAI}
        />
      )}

      {isInActiveGame ? (
        <GameView
          game={game} board={board} selected={selected} lastMove={lastMove}
          dragPiece={dragPiece} animatingPiece={animatingPiece} capturedPieces={capturedPieces}
          pendingPromotion={pendingPromotion} customHistory={customHistory} playerColor={playerColor}
          isLocalGame={isLocalGame} isAIGame={isAIGame} is3D={is3D} customGameOver={customGameOver}
          drawOfferPending={drawOfferPending}
          userUsername={user?.currentGame?.player1?.username}
          opponentUsername={user?.currentGame?.player2?.username}
          onSquareClick={handleSquareClick}
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

      <FloatingPiece dragPiece={dragPiece} game={game} />
      {animatingPiece && <AnimatedPiece data={animatingPiece} onDone={clearAnimation} />}
    </div>
  );
}
