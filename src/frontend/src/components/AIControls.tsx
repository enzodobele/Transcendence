import { useTranslation } from "react-i18next";

interface AIControlsProps {
  isAIMode: boolean;
  difficulty: number;
  onToggleAI: () => void;
  onDifficultyChange: (level: number) => void;
}

const DIFFICULTY_LABEL_KEYS: Record<number, string> = {
  1: "game.difficulty.beginner",
  2: "game.difficulty.easy",
  3: "game.difficulty.medium",
  4: "game.difficulty.hard",
  5: "game.difficulty.expert",
};

export function AIControls({ isAIMode, difficulty, onToggleAI, onDifficultyChange }: AIControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="ai-controls">
      <button onClick={onToggleAI} className="button-ai">
        {isAIMode ? t("game.playVsHuman") : t("game.playVsAI")}
      </button>

      {isAIMode && (
        <div className="difficulty-selector">
          <span>{t(DIFFICULTY_LABEL_KEYS[difficulty])}</span>
          <input
            type="range"
            min={1}
            max={5}
            value={difficulty}
            onChange={(e) => onDifficultyChange(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}