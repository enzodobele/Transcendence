import "../../styles/FindGame/FindGameOverlay.css"; // 🌟 CSS dédié pour la modale

interface FindGameOverlayProps {
  isOpen: boolean;
  onCancel: () => void;
}

export function FindGameOverlay({ isOpen, onCancel }: FindGameOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="matchmaking-overlay">
      <div className="matchmaking-content">
        <div className="matchmaking-spinner"></div>
        <h3 className="matchmaking-title">Recherche d'un adversaire</h3>
        <p className="pulse-text">Veuillez patienter pendant que nous vous trouvons un rival...</p>
        
        <button onClick={onCancel} className="button-cancel-game">
          Annuler la recherche
        </button>
      </div>
    </div>
  );
}