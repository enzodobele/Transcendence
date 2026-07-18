import React from "react";
import { useTranslation } from "react-i18next";
import wQ from "../../assets/pieces/wQ.svg";
import wR from "../../assets/pieces/wR.svg";
import wB from "../../assets/pieces/wB.svg";
import wN from "../../assets/pieces/wN.svg";
import bQ from "../../assets/pieces/bQ.svg";
import bR from "../../assets/pieces/bR.svg";
import bB from "../../assets/pieces/bB.svg";
import bN from "../../assets/pieces/bN.svg";

interface PromotionDialogProps {
  onChoose: (pieceName: string) => void;
  playerColor: "w" | "b";
}

const piecesMap: Record<string, Record<"w" | "b", string>> = {
  queen: { w: wQ, b: bQ },
  rook: { w: wR, b: bR },
  bishop: { w: wB, b: bB },
  knight: { w: wN, b: bN },
};

const pieceLabelKeyMap: Record<string, string> = {
  queen: "game.promotion.queen",
  rook: "game.promotion.rook",
  bishop: "game.promotion.bishop",
  knight: "game.promotion.knight",
};

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  onChoose,
  playerColor,
}) => {
  const { t } = useTranslation();
  const promotionPieces = ["queen", "rook", "bishop", "knight"];

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "30px",
        borderRadius: "10px",
        zIndex: 1000,
        textAlign: "center",
        border: "3px solid gold",
      }}
    >
      <h2 style={{ color: "white", marginBottom: "20px" }}>
        {t("game.promotion.title")}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "15px",
        }}
      >
        {promotionPieces.map((piece) => {
          const pieceSvg = piecesMap[piece][playerColor];
          const pieceLabel = t(pieceLabelKeyMap[piece]);

          return (
            <button
              key={piece}
              onClick={() => onChoose(piece)}
              style={{
                padding: "10px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "background-color 0.3s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#45a049")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#4CAF50")
              }
            >
              <img
                src={pieceSvg}
                alt={pieceLabel}
                style={{
                  width: "50px",
                  height: "50px",
                  marginBottom: "8px",
                }}
              />
              <span>{pieceLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
