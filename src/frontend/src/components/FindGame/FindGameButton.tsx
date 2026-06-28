import { useState } from "react";
import { useFindGame } from "../../hooks/useFindGame";
import { FindGameOverlay } from "./FindGameOverlay";
import "../../styles/FindGame/FindGameButton.css";

interface FindGameButtonProps {
  onStartLocalGame: () => void;
}

export function FindGameButton({ onStartLocalGame }: FindGameButtonProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const { isSearching, error, startSearch, cancelSearch } = useFindGame();

  return (
    <>
      <div className="find-game-wrapper">
        {error && <p className="lobby-error">{error}</p>}
        <button onClick={() => setIsOverlayOpen(true)} className="button-find-game">
          Jouer
        </button>
      </div>

      <FindGameOverlay 
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        isSearching={isSearching}
        onStartMatchmaking={startSearch}
        onCancelMatchmaking={cancelSearch}
        onSelectLocalGame={onStartLocalGame}
      />
    </>
  );
}