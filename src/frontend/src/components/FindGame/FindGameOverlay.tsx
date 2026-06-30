import { useState } from "react";
import { Users, Bot, Brain, Cpu, Globe, UserPlus } from "lucide-react";
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
  onStartAIvsAI: (difficulty: number) => void;
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
  onStartAIvsAI,
}: FindGameOverlayProps) {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isAIvsAIOpen, setIsAIvsAIOpen] = useState(false);

  if (!isOpen) return null;

  const handleStartAiGame = () => setIsTrainingOpen(true);

  const handleTrainingStart = (difficulty: number) => {
    setIsTrainingOpen(false);
    onClose();
    onStartAiGame(difficulty);
  };

  const handleAIvsAIStart = (difficulty: number) => {
    setIsAIvsAIOpen(false);
    onClose();
    onStartAIvsAI(difficulty);
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
      icon: Users,
    },
    {
      id: "ai",
      title: "Entraînement",
      description: "Affrontez Stockfish pour parfaire vos ouvertures.",
      direction: "down" as const,
      action: handleStartAiGame,
      icon: Bot,
    },
    {
      id: "custom-ai",
      title: "IA Maison",
      description: "Affrontez notre IA entraînée sur 1M de parties Lichess.",
      direction: "down" as const,
      action: onStartCustomAI,
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
      action: onStartMatchmaking,
      icon: Globe,
    },
    {
      id: "duel",
      title: "Duel d'amis",
      description: "Créez une salle privée et envoyez un lien de défi.",
      direction: "up" as const,
      action: handleCreateFriendDuel,
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
            {/* 🚀 Boucle dynamique sur le tableau préparé */}
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