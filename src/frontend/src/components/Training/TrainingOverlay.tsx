import { useState } from "react";
import "../../styles/Training/TrainingOverlay.css";

interface TrainingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (difficulty: number) => void;
}

const DIFFICULTIES = [
  { level: 1, label: "Débutant",      elo: "~800",   description: "Pour apprendre les bases" },
  { level: 2, label: "Facile",        elo: "~1100",  description: "Un adversaire indulgent" },
  { level: 3, label: "Intermédiaire", elo: "~1500",  description: "Un vrai défi équilibré" },
  { level: 4, label: "Difficile",     elo: "~2000",  description: "Pour les joueurs confirmés" },
  { level: 5, label: "Expert",        elo: "~2800",  description: "Bonne chance..." },
];

export function TrainingOverlay({ isOpen, onClose, onStart }: TrainingOverlayProps) {
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

        <h2 className="training-title">Entraînement</h2>
        <p className="training-subtitle">Choisissez votre niveau de difficulté</p>

        <div className="training-difficulties">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.level}
              className={`training-difficulty-btn${selected === d.level ? " selected" : ""}`}
              onClick={() => setSelected(d.level)}
            >
              <div className="training-difficulty-header">
                <span className="training-difficulty-label">{d.label}</span>
                <span className="training-difficulty-elo">{d.elo}</span>
              </div>
              <span className="training-difficulty-desc">{d.description}</span>
            </button>
          ))}
        </div>

        <button className="training-start-button" onClick={() => onStart(selected)}>
          Sélectionner ce niveau
        </button>

      </div>
    </div>
  );
}
