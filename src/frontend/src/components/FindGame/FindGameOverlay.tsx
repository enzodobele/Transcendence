import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);
  const [isAIvsAIOpen, setIsAIvsAIOpen] = useState(false);

  if (!isOpen) return null;

  // Handlers for the difficulty sub-windows (Stockfish & AI vs AI)
  const handleTrainingStart = (difficulty: number) => {
    setIsTrainingOpen(false);
    onModeSelected({ id: "ai", label: t("findGame.modes.ai.title"), difficulty });
    onClose();
  };

  const handleAIvsAIStart = (difficulty: number) => {
    setIsAIvsAIOpen(false);
    onModeSelected({ id: "ai-vs-ai", label: t("findGame.modes.aiVsAi.title"), difficulty });
    onClose();
  };

  const GAME_MODES = [
    {
      id: "local",
      title: t("findGame.modes.local.title"),
      description: t("findGame.modes.local.description"),
      direction: "down" as const,
      action: () => {
        onModeSelected({ id: "local", label: t("findGame.modes.local.title") });
        onClose();
      },
      icon: Users,
    },
    {
      id: "ai",
      title: t("findGame.modes.ai.title"),
      description: t("findGame.modes.ai.description"),
      direction: "down" as const,
      action: () => setIsTrainingOpen(true),
      icon: Bot,
    },
    {
      id: "custom-ai",
      title: t("findGame.modes.customAi.title"),
      description: t("findGame.modes.customAi.description"),
      direction: "down" as const,
      action: () => {
        onModeSelected({ id: "custom-ai", label: t("findGame.modes.customAi.title") });
        onClose();
      },
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
      action: () => {
        onModeSelected({ id: "matchmaking", label: t("findGame.modes.matchmaking.title") });
        onClose();
      },
      icon: Globe,
    },
    // {
    //   id: "duel",
    //   title: t("findGame.modes.duel.title"),
    //   description: t("findGame.modes.duel.description"),
    //   direction: "up" as const,
    //   action: () => {
    //     onModeSelected({ id: "duel", label: t("findGame.modes.duel.title") });
    //     onClose();
    //   },
    //   icon: UserPlus,
    // }
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
