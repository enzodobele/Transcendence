import { useState, useEffect } from "react";
import { useChessGame } from "./useChessGame";
import { useStockfish } from "../useStockfish";
import { useChessAI } from "../useChessAI";
import { useGameWebSocket } from "./useGameWebSocket";

interface UseGameLogicProps {
  user: any;
  token: string | null;
  refreshUserStatus: () => void;
}

export function useGameLogic({ user, token, refreshUserStatus }: UseGameLogicProps) {
  const [isLocalGame, setIsLocalGame] = useState(false);
  const [isAIGame, setIsAIGame] = useState(false);
  const [isCustomAI, setIsCustomAI] = useState(false);
  const [isAIvsAI, setIsAIvsAI] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState(3);
  const [customGameOver, setCustomGameOver] = useState<string | null>(null);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [is3D, setIs3D] = useState(false);

  const [isGameViewActive, setIsGameViewActive] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | undefined>(undefined);
  const [onlinePlayerColor, setOnlinePlayerColor] = useState<"white" | "black">("white");

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
    if (isAIGame && !isAIvsAI) {
      if (isCustomAI) requestCustomAIMove(game.fen());
      else requestStockfishMove(game.fen(), aiDifficulty);
    }
  }, isLocalGame);

  // Gestion des combats d'IA
  useEffect(() => {
    if (!isAIvsAI || game.isGameOver() || customGameOver) return;
    if (game.turn() === "w") requestCustomAIMove(game.fen());
    else requestStockfishMove(game.fen(), aiDifficulty);
  }, [board, isAIvsAI]);

  // WebSocket avec gestion de la déconnexion intégrée
  const { 
    sendMoveToServer, 
    sendResign, 
    sendDrawOffer, 
    sendDrawAccept, 
    sendDrawRefuse,
    sendClaimVictory,
    isOpponentDisconnected,
    disconnectTimeout
  } = useGameWebSocket({
    token,
    gameId: activeGameId,
    isLocalGame,
    syncWithServerFen,
    makeMove,
    onGameOver: (reason, winnerColor) => {
      setCustomGameOver(
        reason === "resign"
          ? winnerColor === "white" ? "Les blancs gagnent !" : "Les noirs gagnent !"
          : reason === "abandon"
          ? winnerColor === "white" ? "Victoire par forfait des blancs !" : "Victoire par forfait des noirs !"
          : "Partie nulle !"
      );
      refreshUserStatus();
    },
    onDrawOffer: () => setDrawOfferPending(true),
    onDrawRefused: () => alert("La nulle a été refusée."),
  });

  triggerServerMove = sendMoveToServer;

  // Synchro de la partie en cours de l'utilisateur
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
    setIsAIvsAI(false);
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

  const handleStartAIvsAI = (difficulty: number) => {
    handleReturnToMenu();
    setAiDifficulty(difficulty);
    setIsAIvsAI(true);
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

  return {
    isLocalGame, isAIGame, isAIvsAI, is3D, setIs3D,
    customGameOver, drawOfferPending, isInActiveGame, playerColor,
    game, board, selected, lastMove, dragPiece, animatingPiece, clearAnimation,
    capturedPieces, pendingPromotion, customHistory,
    isOpponentDisconnected, disconnectTimeout,
    
    handleSquareClick, handlePiecePointerDown, handlePromotionChoice,
    handleReturnToMenu, handleStartAiGame, handleStartCustomAI, handleStartAIvsAI,
    handleStartLocalGame, handleResign, handleOfferDraw, handleDrawAccept,
    handleDrawRefuse, handleResetGame, sendClaimVictory
  };
}