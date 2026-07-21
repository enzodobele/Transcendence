import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { CustomMove } from "../types/types";
import "../styles/MoveHistory.css";

export interface MoveHistoryProps {
  history: CustomMove[];
  player1Name?: string;
  player2Name?: string;
}

const getPieceSymbol = (piece: string) => {
  switch (piece.toUpperCase()) {
    case "K": return "♔";
    case "Q": return "♕";
    case "R": return "♖";
    case "B": return "♗";
    case "N": return "♘";
    default: return "";
  }
};

export function MoveHistory({
  history,
  player1Name,
  player2Name,
}: MoveHistoryProps) {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const renderMoves = () => {
    const rows = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push({
        number: Math.floor(i / 2) + 1,
        white: history[i],
        black: history[i + 1] || null,
      });
    }

    return rows.map((row) => (
      <div key={row.number} className="move-row">
        <span className="move-number">{row.number}.</span>
        
        {/* Coup des Blancs ⚪ */}
        <span className="move-notation">
          <span className="piece-icon">{getPieceSymbol(row.white.piece)}</span>
          {row.white.from} <span className="arrow-sep">➔</span> {row.white.to}
          {row.white.isCheckmate ? " #" : row.white.isCheck ? " +" : ""}
        </span>
        
        {/* Coup des Noirs ⚫ */}
        <span className="move-notation">
          {row.black ? (
            <>
              <span className="piece-icon">{getPieceSymbol(row.black.piece)}</span>
              {row.black.from} <span className="arrow-sep">➔</span> {row.black.to}
              {row.black.isCheckmate ? " #" : row.black.isCheck ? " +" : ""}
            </>
          ) : (
            ""
          )}
        </span>
      </div>
    ));
  };

  return (
    <div className="move-history-container">
      <h3>{t("game.moveHistory")}</h3>

      {/* 👑 PREMIÈRE LIGNE : Affichage des adversaires */}
      <div
        className="players-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "8px 12px",
          marginBottom: "10px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "4px",
          fontSize: "0.9em",
          fontWeight: "bold",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span style={{ color: "#fff" }}>⚪ {player1Name ?? t("game.player1")}</span>
        <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>vs</span>
        <span style={{ color: "#aaa" }}>⚫ {player2Name ?? t("game.player2")}</span>
      </div>

      <div className="move-list">
        {history.length === 0 ? (
          <p className="no-moves">{t("game.noMoves")}</p>
        ) : (
          renderMoves()
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}