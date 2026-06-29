import { useState } from "react";
import "../../styles/FindGame/FindGameOverlay.css";
import { ModeCard } from "./ModeCard";
import { TrainingOverlay } from "../Training/TrainingOverlay";

interface FindGameOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatchmaking: () => void;
  onCancelMatchmaking: () => void;
  isSearching: boolean;
  onSelectLocalGame: () => void;
  onStartAiGame: (difficulty: number) => void;
  onStartCustomAI: () => void;
}

export function FindGameOverlay({
  isOpen,
  onClose,
  onStartMatchmaking,
  onCancelMatchmaking,
  isSearching,
  onSelectLocalGame,
  onStartAiGame,
  onStartCustomAI,
}: FindGameOverlayProps) {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);

  if (!isOpen) return null;

  const handleStartAiGame = () => setIsTrainingOpen(true);

  const handleTrainingStart = (difficulty: number) => {
    setIsTrainingOpen(false);
    onClose();
    onStartAiGame(difficulty);
  };

  const handleCreateFriendDuel = () => {
    alert("Lien d'invitation bientôt dispo ! (En attente du backend)");
  };

  const GAME_MODES = [
    {
      id: "local",
      title: "Partie Libre",
      description: "Jouez tranquillement sur un échiquier local, sans pression.",
      direction: "down" as const,
      action: () => { onSelectLocalGame(); onClose(); },
    },
    {
      id: "ai",
      title: "Entraînement",
      description: "Affrontez Stockfish pour parfaire vos ouvertures.",
      direction: "down" as const,
      action: handleStartAiGame,
    },
    {
      id: "custom-ai",
      title: "IA Maison",
      description: "Affrontez notre IA entraînée sur 1M de parties Lichess.",
      direction: "down" as const,
      action: onStartCustomAI,
    },
    {
      id: "matchmaking",
      title: "Matchmaking Aléatoire",
      description: "Trouvez un adversaire à votre taille en ligne (Classement Elo).",
      direction: "up" as const,
      action: onStartMatchmaking,
    },
    {
      id: "duel",
      title: "Duel d'amis",
      description: "Créez une salle privée et envoyez un lien de défi.",
      direction: "up" as const,
      action: handleCreateFriendDuel,
    }
  ];

  return (
    <>
    <TrainingOverlay
      isOpen={isTrainingOpen}
      onClose={() => setIsTrainingOpen(false)}
      onStart={handleTrainingStart}
    />
    <div className="matchmaking-overlay" onClick={onClose}>
      <div className="matchmaking-content" onClick={(e) => e.stopPropagation()}>
        
        {!isSearching ? (
          <div className="modes-grid">
            {/* 🚀 Boucle dynamique sur le tableau préparé */}
            {GAME_MODES.map((mode) => (
              <ModeCard
                key={mode.id}
                title={mode.title}
                description={mode.description}
                direction={mode.direction}
                onClick={mode.action}
              />
            ))}
          </div>
        ) : (
          /* ════════ SUB-ÉCRAN 2 : ATTENTE MATCHMAKING ════════ */
          <div className="matchmaking-searching-view">
            <div className="matchmaking-spinner"></div>
            <h3 className="matchmaking-title">Recherche d'un adversaire</h3>
            <p className="pulse-text">Veuillez patienter pendant que nous vous trouvons un rival...</p>
            
            <button onClick={onCancelMatchmaking} className="button-cancel-game">
              Annuler la recherche
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}