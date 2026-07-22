import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameView } from "./Board/GameView";
import { useChessGame } from "../hooks/chess/useChessGame";
import { getFriends } from "../services/auth";
import { useSpectatorWebSocket, type SpectatorGameInfo } from "../hooks/chess/useSpectatorWebSocket";
import "../styles/main.css";

interface FriendSummary {
  username: string;
}

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
  const { t } = useTranslation();
  const gameId = useMemo(() => getGameIdFromUrl(), []);
  const [customGameOver, setCustomGameOver] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [gameInfo, setGameInfo] = useState<SpectatorGameInfo | null>(null);

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
    onGameInfo: (info) => setGameInfo(info),
    onGameNotAvailable: quitSpectatorMode,
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setFriends([]);
      return;
    }

    getFriends()
      .then((nextFriends) => {
        setFriends(nextFriends.map((friend) => ({ username: friend.username })));
      })
      .catch(() => {
        setFriends([]);
      });
  }, []);

  const spectatorLabels = useMemo(() => {
    if (!gameInfo) {
      return [] as string[];
    }

    const friendNames = new Set(friends.map((friend) => friend.username.toLowerCase()));
    const whiteIsFriend = friendNames.has(gameInfo.player1Username.toLowerCase());
    const blackIsFriend = friendNames.has(gameInfo.player2Username.toLowerCase());

    if (whiteIsFriend && blackIsFriend) {
      return [
        t("spectator.friendPlaysWhite", { name: gameInfo.player1Username }),
        t("spectator.friendPlaysBlack", { name: gameInfo.player2Username }),
      ];
    }

    if (whiteIsFriend) {
      return [t("spectator.friendPlaysWhite", { name: gameInfo.player1Username })];
    }

    if (blackIsFriend) {
      return [t("spectator.friendPlaysBlack", { name: gameInfo.player2Username })];
    }

    return [
      t("spectator.playerPlaysWhite", { name: gameInfo.player1Username }),
      t("spectator.playerPlaysBlack", { name: gameInfo.player2Username }),
    ];
  }, [friends, gameInfo, t]);

  if (!gameId) {
    return (
      <div className="app-loading">
        <div className="spinner">{t("spectator.missingGameId")}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div style={{ position: "absolute", top: 16, left: 16, color: "white" }}>
        {t("spectator.mode")} {isConnected ? t("spectator.online") : t("spectator.connecting")}
      </div>

      {spectatorLabels.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 16,
            zIndex: 10,
            background: "rgba(8, 13, 24, 0.78)",
            color: "#f2f5ff",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            borderRadius: 12,
            padding: "10px 12px",
            display: "grid",
            gap: 4,
          }}
        >
          {spectatorLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      )}

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
        {t("spectator.quit")}
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