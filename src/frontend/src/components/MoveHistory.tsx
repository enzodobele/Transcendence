import { useEffect, useRef } from "react";
import "../styles/MoveHistory.css";

interface MoveHistoryProps {
  history: string[];
}

export function MoveHistory({ history }: MoveHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Défilement automatique vers le bas à chaque nouveau coup
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Regroupe les coups par tour (1. e4 e5)
  const renderMoves = () => {
    const rows = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push({
        number: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1] || "",
      });
    }

    return rows.map((row) => (
      <div key={row.number} className="move-row">
        <span className="move-number">{row.number}.</span>
        <span className="move-notation">{row.white}</span>
        <span className="move-notation">{row.black}</span>
      </div>
    ));
  };

  return (
    <div className="move-history-container">
      <h3>Historique des coups</h3>
      <div className="move-list">
        {history.length === 0 ? (
          <p className="no-moves">Aucun coup joué</p>
        ) : (
          renderMoves()
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}