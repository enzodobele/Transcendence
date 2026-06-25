import { useEffect, useRef } from "react";
import "../styles/MoveHistory.css";

interface MoveHistoryProps {
  history: string[];
  player1Name?: string; // 💡 Optionnel (ex: blancs)
  player2Name?: string; // 💡 Optionnel (ex: noirs)
}

export function MoveHistory({ history, player1Name = "Joueur 1", player2Name = "Joueur 2" }: MoveHistoryProps) {
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
      
      {/* 👑 PREMIÈRE LIGNE : Affichage des adversaires */}
      <div className="players-header" style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 12px",
        marginBottom: "10px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "4px",
        fontSize: "0.9em",
        fontWeight: "bold",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <span style={{ color: "#fff" }}>⚪ {player1Name}</span>
        <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>vs</span>
        <span style={{ color: "#aaa" }}>⚫ {player2Name}</span>
      </div>

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