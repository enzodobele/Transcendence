import React, { useState, useEffect, useRef } from "react";
import { ChessGame3D } from "./Board/ChessGame3D";

interface LobbyViewProps {
  isAuthenticated: boolean;
  game: any;
  board: any;
  selected: any;
  capturedPieces: any;
  pendingPromotion: any;
  resetGame: () => void;
  handlePromotionChoice: (piece: string) => void;
  handleSquareClick: (square: string, isLobby?: boolean) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  isAuthenticated,
  game,
  board,
  selected,
  capturedPieces,
  pendingPromotion,
  resetGame,
  handlePromotionChoice,
  handleSquareClick,
}) => {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <div className="lobby-container">
      <h1 className="title-chess">CHESS <span className="title-guard">GUARD</span></h1>
      <p className="subtitle-chess-guard">Jouez en local ou en ligne</p>

      <div className="lobby-chessboard-preview" onClick={() => handleLobbyInteraction()}>
        <ChessGame3D
          game={game}
          board={board}
          selected={selected}
          capturedPieces={capturedPieces}
          pendingPromotion={!!pendingPromotion}
          onSquareClick={(square) => handleLobbyInteraction(square)}
          onResetGame={resetGame}
          onPromotionChoice={handlePromotionChoice}
          isDemoMode={isDemoMode}
        />
      </div>

      <div className="lobby-actions">
        {!isAuthenticated && (
          <p className="login-prompt">Connectez-vous pour défier des joueurs en ligne.</p>
        )}
      </div>
    </div>
  );
};