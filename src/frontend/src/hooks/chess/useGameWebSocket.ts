import { useEffect, useRef } from "react";
import type { CustomMove } from "../../types/types";

interface UseGameWebSocketProps {
  token: string | null;
  gameId: number | undefined;
  isLocalGame: boolean;
  syncWithServerFen: (fen: string, history?: CustomMove[]) => void;
  makeMove: (from: string, to: string, promotion?: string, animate?: boolean, isExternal?: boolean) => void;
}

export function useGameWebSocket({
  token,
  gameId,
  isLocalGame,
  syncWithServerFen,
  makeMove,
}: UseGameWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);

  const sendMoveToServer = (moveData: { from: string; to: string; promotion?: string }) => {
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

  useEffect(() => {
    if (isLocalGame || !gameId || !token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
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
            syncWithServerFen(message.fen, message.history);
            break;
          case "opponent_move":
            const { from, to, promotion } = message.move;
            makeMove(from, to, promotion, true, true);
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
  }, [gameId, isLocalGame, token]);

  return { sendMoveToServer };
}