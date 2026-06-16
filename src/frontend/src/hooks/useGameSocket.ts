import { useEffect, useRef, useState } from "react";

type Status = "connecting" | "waiting" | "playing" | "over";

export const useGameSocket = () =>
{
    const [status, setStatus] = useState<Status>("connecting");
    const [color, setColor] = useState<"white" | "black" | null>(null);
    const [opponentMove, setOpponentMove] = useState<{ from: string, to: string } | null>(null);
    const [result, setResult] = useState<{ reason: string; winner: string | null } | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => 
    {
        if (wsRef.current)
            return;

        const ws = new WebSocket(`wss://${location.host}/api/ws`);
        wsRef.current = ws;

        ws.onmessage = (e) =>
        {
            const msg = JSON.parse(e.data);
            console.log("Recu du serveur: ", msg);

            if (msg.type === "waiting")
            {
                setColor(msg.color);
                setStatus("waiting");
            }
            else if (msg.type === "start")
            {
                setColor(msg.color);
                setStatus("playing");
            }
            else if (msg.type === "opponentMove")
            {
                setOpponentMove({ from: msg.from, to: msg.to });
            }
            else if (msg.type === "gameOver")
            {
                setResult({reason: msg.reason, winner: msg.winner });
                setStatus("over");
            }
            else if (msg.type === "opponentLeft")
            {
                setResult({reason: "opponentLeft", winner: null });
                setStatus("over");
            }
        };
    }, []);

    const sendMove = (from: string, to: string) =>
    {
        wsRef.current?.send(JSON.stringify({ type: "move", from, to }));
    }

    return { status, color, sendMove, opponentMove, result };
};