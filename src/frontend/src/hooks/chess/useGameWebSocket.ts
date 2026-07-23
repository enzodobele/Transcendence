import { useEffect, useRef, useState } from "react";
import type { CustomMove } from "../../types/types";

interface UseGameWebSocketProps {
  token: string | null;
  gameId: number | undefined;
  isLocalGame: boolean;
  syncWithServerFen: (fen: string, history?: CustomMove[]) => void;
  makeMove: (from: string, to: string, promotion?: string, animate?: boolean, isExternal?: boolean) => void;
  // 🎯 On étend les raisons de fin de partie à "abandon" pour gérer notre forfait
  onGameOver: (reason: "resign" | "draw" | "abandon", winnerColor?: "white" | "black") => void;
  onDrawOffer: () => void;
  onDrawRefused: () => void;
}

export function useGameWebSocket({
  token,
  gameId,
  isLocalGame,
  syncWithServerFen,
  makeMove,
  onGameOver,
  onDrawOffer,
  onDrawRefused,
}: UseGameWebSocketProps) {
  const wsRef = useRef<WebSocket | null>(null);

  // ⏱️ NOUVEAUX ÉTATS POUR LA GESTION DE LA DÉCONNEXION
  const [isOpponentDisconnected, setIsOpponentDisconnected] = useState(false);
  const [disconnectTimeout, setDisconnectTimeout] = useState(120); // 120s par défaut (2 min)

  const sendMoveToServer = (moveData: { from: string; to: string; promotion?: string }) => {
    if (isLocalGame) return;
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "move", data: moveData }));
  };

  const sendResign = () => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "resign" }));
  };

  const sendDrawOffer = () => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "draw_offer" }));
  };

  const sendDrawAccept = () => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "draw_accept" }));
  };

  const sendDrawRefuse = () => {
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "draw_refuse" }));
  };

  // 🚀 NOUVELLE MÉTHODE : Envoyer l'ordre de réclamation au serveur
  const sendClaimVictory = () => {
    if (isLocalGame) return;
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(JSON.stringify({ type: "claim_victory" }));
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
            makeMove(message.move.from, message.move.to, message.move.promotion, true, true);
            break;
          case "game_over":
            // Ferme l'overlay de déconnexion si la partie est terminée
            setIsOpponentDisconnected(false);
            onGameOver(message.reason, message.winnerColor);
            break;
          case "draw_offer":
            onDrawOffer();
            break;
          case "draw_refused":
            onDrawRefused();
            break;
          
          // 🚨 NOUVEAUX CAS POUR LES TIMERS DE RECONNEXION
          case "opponent_disconnected":
            console.warn(`[ChessGuard WS] Adversaire déconnecté. Timer : ${message.timeoutMs}ms`);
            setDisconnectTimeout(Math.floor(message.timeoutMs / 1000));
            setIsOpponentDisconnected(true);
            break;

          case "opponent_reconnected":
            console.log("[ChessGuard WS] L'adversaire est revenu en jeu !");
            setIsOpponentDisconnected(false);
            break;

          case "claim_victory_available":
            console.log("[ChessGuard WS] Autorisation de forcer la victoire reçue du serveur.");
            // Force le timer à 0 pour débloquer le bouton instantanément côté client
            setDisconnectTimeout(0);
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
      ws.close();
      wsRef.current = null;
    };
  }, [gameId, isLocalGame, token]);

  return { 
    sendMoveToServer, 
    sendResign, 
    sendDrawOffer, 
    sendDrawAccept, 
    sendDrawRefuse,
    sendClaimVictory,
    isOpponentDisconnected,
    disconnectTimeout
  };
}