import { useMemo, useState } from "react";
import { GameView } from "./Board/GameView";
import { useChessGame } from "../hooks/chess/useChessGame";
import { useSpectatorWebSocket } from "../hooks/chess/useSpectatorWebSocket";
import "../styles/main.css";

function noopSquareClick(_square: string): void
{
}

function noopPiecePointerDown(_square: string, _e: React.PointerEvent): void
{
}

function noopPromotionChoice(_piece: string): void
{
}

function quitSpectatorMode(): void
{
  window.location.href = "/";
}

function getGameIdFromUrl(): number | undefined {
  const params = new URLSearchParams(window.location.search);
  const rawGameId = params.get("gameId");
  if (!rawGameId) return undefined;

  const parsed = Number(rawGameId);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SpectatorPage() {
  const gameId = useMemo(() => getGameIdFromUrl(), []);
  const [customGameOver, setCustomGameOver] = useState<string | null>(null);

  const {
    game,
    board,
    selected,
    lastMove,
    dragPiece,
    animatingPiece,
    capturedPieces,
    pendingPromotion,
    customHistory,
    resetGame,
    syncWithServerFen,
  } = useChessGame("white", undefined, false);

  const { isConnected } = useSpectatorWebSocket({
    gameId,
    syncWithServerFen,
    onGameOver: (message) => setCustomGameOver(message),
  });

  if (!gameId) {
    return (
      <div className="app-loading">
        <div className="spinner">Missing gameId in URL. Use /spectate?gameId=123</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{ position: "absolute", top: 16, left: 16, color: "white" }}>
        Spectator mode {isConnected ? "online" : "connecting..."}
      </div>

      <button
        type="button"
        onClick={quitSpectatorMode}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          background: "#9a2f2f",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Quitter le mode spectateur
      </button>

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
        playerColor="white"
        isLocalGame={false}
        isAIGame={false}
        is3D={false}
        customGameOver={customGameOver}
        drawOfferPending={false}
        onSquareClick={noopSquareClick}
        onPiecePointerDown={noopPiecePointerDown}
        onResetGame={resetGame}
        onPromotionChoice={noopPromotionChoice}
        onLeaveLocalGame={() => {}}
        onReturnToMenu={quitSpectatorMode}
        onResign={() => {}}
        onOfferDraw={() => {}}
        onDrawAccept={() => {}}
        onDrawRefuse={() => {}}
        isSpectator
      />
    </div>
  );
}