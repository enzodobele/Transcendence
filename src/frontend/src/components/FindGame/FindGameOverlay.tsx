import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
    alert(t("findGame.inviteComingSoon"));
  };

  const GAME_MODES = [
    {
      id: "local",
      title: t("findGame.modes.local.title"),
      description: t("findGame.modes.local.description"),
      direction: "down" as const,
      action: () => { onSelectLocalGame(); onClose(); },
      icon: Users,
    },
    {
      id: "ai",
      title: t("findGame.modes.ai.title"),
      description: t("findGame.modes.ai.description"),
      direction: "down" as const,
      action: handleStartAiGame,
      icon: Bot,
    },
    {
      id: "custom-ai",
      title: t("findGame.modes.customAi.title"),
      description: t("findGame.modes.customAi.description"),
      direction: "down" as const,
      action: onStartCustomAI,
      icon: Brain,
    },
    {
      id: "ai-vs-ai",
      title: t("findGame.modes.aiVsAi.title"),
      description: t("findGame.modes.aiVsAi.description"),
      direction: "down" as const,
      action: () => setIsAIvsAIOpen(true),
      icon: Cpu,
    },
    {
      id: "matchmaking",
      title: t("findGame.modes.matchmaking.title"),
      description: t("findGame.modes.matchmaking.description"),
      direction: "up" as const,
      action: onStartMatchmaking,
      icon: Globe,
    },
    {
      id: "duel",
      title: t("findGame.modes.duel.title"),
      description: t("findGame.modes.duel.description"),
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
            <h3 className="matchmaking-title">{t("findGame.searching")}</h3>
            <p className="pulse-text">{t("findGame.searchingSubtitle")}</p>

            <button onClick={onCancelMatchmaking} className="button-cancel-game">
              {t("findGame.cancelSearch")}
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}