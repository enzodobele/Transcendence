// frontend/src/components/FindGameButton.tsx
import { useFindGame } from "../hooks/useFindGame";

export function FindGameButton() {
  // On récupère tout ce dont on a besoin depuis notre cerveau (le Hook)
  const { isSearching, error, startSearch, cancelSearch } = useFindGame();

  // Si on cherche une partie, on affiche le loader et le bouton Annuler
  if (isSearching) {
    return (
      <div className="matchmaking-container">
        <p className="pulse-text">Recherche d'un adversaire en cours...</p>
        <button onClick={cancelSearch} className="button-cancel-game">
          Annuler la recherche
        </button>
      </div>
    );
  }

  // Sinon, on affiche le bouton pour lancer la recherche
  return (
    <div className="find-game-wrapper">
      {error && <p className="lobby-error">{error}</p>}
      <button onClick={startSearch} className="button-find-game">
        Chercher une partie en ligne
      </button>
    </div>
  );
}