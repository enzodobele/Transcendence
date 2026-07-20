import { useEffect, useRef, useState } from "react";
import type { CustomMove } from "../../types/types";

export interface SpectatorGameInfo {
  player1Username: string;
  player2Username: string;
}

interface UseSpectatorWebSocketProps {
  gameId: number | undefined;
  syncWithServerFen: (fen: string, history?: CustomMove[]) => void;
  onGameOver: (message: string) => void;
  onGameInfo: (info: SpectatorGameInfo) => void;
}

export function useSpectatorWebSocket({
  gameId,
  syncWithServerFen,
  onGameOver,
  onGameInfo,
}: UseSpectatorWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const syncRef = useRef(syncWithServerFen);
  const gameOverRef = useRef(onGameOver);
  const gameInfoRef = useRef(onGameInfo);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    syncRef.current = syncWithServerFen;
  }, [syncWithServerFen]);

  useEffect(() => {
    gameOverRef.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    gameInfoRef.current = onGameInfo;
  }, [onGameInfo]);

  useEffect(() => {
    if (!gameId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const token = localStorage.getItem("token");
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    const wsUrl = `${protocol}//${window.location.host}/ws?spectator=1&gameId=${gameId}${tokenParam}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "sync":
            syncRef.current(message.fen, message.history);
            gameInfoRef.current({
              player1Username: message.player1Username ?? "",
              player2Username: message.player2Username ?? "",
            });
            break;
          case "opponent_move":
            syncRef.current(message.fen);
            break;
          case "game_over":
            gameOverRef.current(
              message.reason === "resign"
                ? "Partie terminée par abandon"
                : message.reason === "abandon"
                ? "Partie terminée par forfait"
                : "Partie nulle !",
            );
            break;
        }
      } catch {
        // Silence: le spectateur ignore les messages invalides.
      }
    };

    ws.onerror = () => setIsConnected(false);
    ws.onclose = () => setIsConnected(false);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId]);

  return { isConnected };
}