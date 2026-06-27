import { useFindGame } from "../../hooks/useFindGame";
import { FindGameOverlay } from "./FindGameOverlay"; // 🌟 Import de l'overlay
import "../../styles/FindGame/FindGameButton.css";

export function FindGameButton() {
  const { isSearching, error, startSearch, cancelSearch } = useFindGame();

  return (
    <>
      <div className="find-game-wrapper">
        {error && <p className="lobby-error">{error}</p>}
        <button onClick={startSearch} className="button-find-game">
          Jouer
        </button>
      </div>

      {/* 🌟 L'overlay est piloté directement ici */}
      <FindGameOverlay isOpen={isSearching} onCancel={cancelSearch} />
    </>
  );
}