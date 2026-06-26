import { useEffect, useRef } from "react";

const DIFFICULTY_CONFIG: Record<number, { skillLevel: number; depth: number; movetime: number }> = {
  1: { skillLevel: 0,  depth: 1,  movetime: 100  },
  2: { skillLevel: 5,  depth: 5,  movetime: 300  },
  3: { skillLevel: 10, depth: 10, movetime: 800  },
  4: { skillLevel: 15, depth: 15, movetime: 1500 },
  5: { skillLevel: 20, depth: 20, movetime: 3000 },
};

export const useStockfish = (
  onAIMove: (from: string, to: string, promotion?: string) => void
) => {
  const workerRef = useRef<Worker | null>(null);
  const readyRef  = useRef(false);

  useEffect(() => {
    const worker = new Worker("/stockfish-18-lite-single.js");
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<string>) => {
      const msg = e.data;

      if (msg === "uciok") {
        worker.postMessage("isready");
      }

      if (msg === "readyok") {
        readyRef.current = true;
      }

      if (msg.startsWith("bestmove")) {
      const move      = msg.split(" ")[1];
      const from      = move.slice(0, 2);
      const to        = move.slice(2, 4);
      const promotion = move.length > 4 ? move[4] : undefined;
      setTimeout(() => onAIMove(from, to, promotion), 500);
      }
    }
    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };

  }, []);

  const requestMove = (fen: string, difficulty: number) => {
    if (!workerRef.current || !readyRef.current)
      return;

    const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[3];
    const worker = workerRef.current;
    worker.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${config.depth} movetime ${config.movetime}`);
  };

  return { requestMove };
};