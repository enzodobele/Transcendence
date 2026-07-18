import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Swords } from "lucide-react";
import { useFindGame } from "../../hooks/useFindGame";
import { FindGameOverlay } from "./FindGameOverlay";
import "../../styles/FindGame/FindGameButton.css";

interface FindGameButtonProps {
  onStartLocalGame: () => void;
  onStartAiGame: (difficulty: number) => void;
  onStartCustomAI: () => void;
  onStartAIvsAI: (difficulty: number) => void;
}

export function FindGameButton({ onStartLocalGame, onStartAiGame, onStartCustomAI, onStartAIvsAI }: FindGameButtonProps) {
  const { t } = useTranslation();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const { isSearching, error, startSearch, cancelSearch } = useFindGame();

  return (
    <>
      <div className="find-game-wrapper">
        {error && <p className="lobby-error">{t("errors." + error, { defaultValue: t("errors.GENERIC") })}</p>}
        <button onClick={() => setIsOverlayOpen(true)} className="button-find-game">
          <Swords size={18} /> {t("findGame.play")}
        </button>
      </div>

      <FindGameOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        isSearching={isSearching}
        onStartMatchmaking={startSearch}
        onCancelMatchmaking={cancelSearch}
        onSelectLocalGame={onStartLocalGame}
        onStartAiGame={onStartAiGame}
        onStartCustomAI={() => { setIsOverlayOpen(false); onStartCustomAI(); }}
        onStartAIvsAI={(difficulty) => { setIsOverlayOpen(false); onStartAIvsAI(difficulty); }}
      />
    </>
  );
}