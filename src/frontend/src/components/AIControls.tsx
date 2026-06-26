interface AIControlsProps {
  isAIMode: boolean;
  difficulty: number;
  onToggleAI: () => void;
  onDifficultyChange: (level: number) => void;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Débutant (~500 ELO)",
  2: "Facile (~1000 ELO)",
  3: "Moyen (~1500 ELO)",
  4: "Difficile (~2000 ELO)",
  5: "Expert (~3500 ELO)",
};

export function AIControls({ isAIMode, difficulty, onToggleAI, onDifficultyChange }: AIControlsProps) {
  return (
    <div className="ai-controls">
      <button onClick={onToggleAI} className="button-ai">
        {isAIMode ? "Jouer vs Humain" : "Jouer vs IA"}
      </button>

      {isAIMode && (
        <div className="difficulty-selector">
          <span>{DIFFICULTY_LABELS[difficulty]}</span>
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