import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/Training/TrainingOverlay.css";

interface TrainingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (difficulty: number) => void;
}

const DIFFICULTIES = [
  { level: 1, key: "beginner",     elo: "~800" },
  { level: 2, key: "easy",         elo: "~1100" },
  { level: 3, key: "intermediate", elo: "~1500" },
  { level: 4, key: "hard",         elo: "~2000" },
  { level: 5, key: "expert",       elo: "~2800" },
];

export function TrainingOverlay({ isOpen, onClose, onStart }: TrainingOverlayProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(3);

  if (!isOpen) return null;

  return (
    <div className="training-overlay" onClick={onClose}>
      <div className="training-content" onClick={(e) => e.stopPropagation()}>

        <button type="button" onClick={onClose} className="training-close-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <h2 className="training-title">{t("training.title")}</h2>
        <p className="training-subtitle">{t("training.subtitle")}</p>

        <div className="training-difficulties">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.level}
              className={`training-difficulty-btn${selected === d.level ? " selected" : ""}`}
              onClick={() => setSelected(d.level)}
            >
              <div className="training-difficulty-header">
                <span className="training-difficulty-label">{t(`training.difficulty.${d.key}.label`)}</span>
                <span className="training-difficulty-elo">{d.elo}</span>
              </div>
              <span className="training-difficulty-desc">{t(`training.difficulty.${d.key}.description`)}</span>
            </button>
          ))}
        </div>

        <button className="training-start-button" onClick={() => onStart(selected)}>
          {t("training.play")}
        </button>

      </div>
    </div>
  );
}
