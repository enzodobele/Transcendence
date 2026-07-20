import { useState, type Dispatch, type SetStateAction } from "react";
import { Users, Bot, Brain, Cpu, Globe, UserPlus } from "lucide-react";
import "../../styles/FindGame/FindGameOverlay.css";
import { ModeCard } from "./ModeCard";
import { TrainingOverlay } from "../Training/TrainingOverlay";

export interface SelectedGameMode {
  id: "local" | "ai" | "custom-ai" | "ai-vs-ai" | "matchmaking" | "duel" | string;
  label: string;
  difficulty?: number;
}

interface FindGameOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isSearching: boolean;
  onCancelMatchmaking: () => void;
  onModeSelected: Dispatch<SetStateAction<SelectedGameMode>> | ((mode: SelectedGameMode) => void);
}

export function FindGameOverlay({
  isOpen,
  onClose,
  isSearching,
  onCancelMatchmaking,
  onModeSelected,
}: FindGameOverlayProps) {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isAIvsAIOpen, setIsAIvsAIOpen] = useState(false);

  if (!isOpen) return null;

  // Gestionnaires pour les sous-fenêtres de difficulté (Stockfish & IA vs IA)
  const handleTrainingStart = (difficulty: number) => {
    setIsTrainingOpen(false);
    onModeSelected({ id: "ai", label: "Entraînement (Stockfish)", difficulty });
    onClose();
  };

  const handleAIvsAIStart = (difficulty: number) => {
    setIsAIvsAIOpen(false);
    onModeSelected({ id: "ai-vs-ai", label: "IA vs IA", difficulty });
    onClose();
  };

  const GAME_MODES = [
    {
      id: "local",
      title: "Partie Libre",
      description: "Jouez tranquillement sur un échiquier local, sans pression.",
      direction: "down" as const,
      action: () => {
        onModeSelected({ id: "local", label: "Partie Libre" });
        onClose();
      },
      icon: Users,
    },
    {
      id: "ai",
      title: "Entraînement",
      description: "Affrontez Stockfish pour parfaire vos ouvertures.",
      direction: "down" as const,
      action: () => setIsTrainingOpen(true),
      icon: Bot,
    },
    {
      id: "custom-ai",
      title: "IA Maison",
      description: "Affrontez notre IA entraînée sur 1M de parties Lichess.",
      direction: "down" as const,
      action: () => {
        onModeSelected({ id: "custom-ai", label: "IA Maison" });
        onClose();
      },
      icon: Brain,
    },
    {
      id: "ai-vs-ai",
      title: "IA vs IA",
      description: "Regardez notre IA affronter Stockfish.",
      direction: "down" as const,
      action: () => setIsAIvsAIOpen(true),
      icon: Cpu,
    },
	{
      id: "matchmaking",
      title: "Matchmaking Aléatoire",
      description: "Trouvez un adversaire à votre taille en ligne (Classement Elo).",
      direction: "up" as const,
      action: () => {
        onModeSelected({ id: "matchmaking", label: "Matchmaking" });
        onClose();
      },
      icon: Globe,
    },
    {
      id: "duel",
      title: "Duel d'amis",
      description: "Créez une salle privée et envoyez un lien de défi.",
      direction: "up" as const,
      action: () => {
        onModeSelected({ id: "duel", label: "Duel d'amis" });
        onClose();
      },
      icon: UserPlus,
    }
  ];

  return (
    <>
      <TrainingOverlay
        isOpen={isTrainingOpen}
        onClose={() => setIsTrainingOpen(false)}
        onStart={handleTrainingStart}
      />
      <TrainingOverlay
        isOpen={isAIvsAIOpen}
        onClose={() => setIsAIvsAIOpen(false)}
        onStart={handleAIvsAIStart}
      />
      
      <div className="matchmaking-overlay" onClick={onClose}>
        <div className="matchmaking-content" onClick={(e) => e.stopPropagation()}>
          
          {!isSearching ? (
            <div className="modes-grid">
              {GAME_MODES.map((mode) => (
                <ModeCard
                  key={mode.id}
                  title={mode.title}
                  description={mode.description}
                  direction={mode.direction}
                  onClick={mode.action}
                  icon={mode.icon}
                />
              ))}
            </div>
          ) : (
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