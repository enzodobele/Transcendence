import { useState } from "react";
import "../../styles/FindGame/FindGameOverlay.css";

interface FindGameOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatchmaking: () => void;
  onCancelMatchmaking: () => void;
  isSearching: boolean; // État provenant du hook useFindGame
  onSelectLocalGame: () => void;
}

export function FindGameOverlay({
  isOpen,
  onClose,
  onStartMatchmaking,
  onCancelMatchmaking,
  isSearching,
  onSelectLocalGame,
}: FindGameOverlayProps) {
  
  if (!isOpen) return null;

  return (
    <div className="matchmaking-overlay" onClick={onClose}>
      <div className="matchmaking-content" onClick={(e) => e.stopPropagation()}>
        
        {!isSearching ? (
          <>
            <div className="modes-grid">
  {/* 🔽 CES DEUX-LÀ S'ÉTIRENT VERS LE BAS */}
  <button 
    className="mode-card open-down" 
    onClick={() => { onSelectLocalGame(); onClose(); }}
  >
    <div className="mode-info">
      <h3>Partie Libre</h3>
      <p>Jouez tranquillement sur un échiquier local, sans pression.</p>
    </div>
  </button>

  <button className="mode-card open-down" onClick={() => alert("IA bientôt disponible !")}>
    <div className="mode-info">
      <h3>Entraînement</h3>
      <p>Affrontez Stockfish pour parfaire vos ouvertures.</p>
    </div>
  </button>

  {/* 🔼 CES DEUX-LÀ S'ÉTIRENT VERS LE HAUT */}
  <button className="mode-card open-up" onClick={onStartMatchmaking}>
    <div className="mode-info">
      <h3>Matchmaking Aléatoire</h3>
      <p>Trouvez un adversaire à votre taille en ligne (Classement Elo).</p>
    </div>
  </button>

  <button className="mode-card open-up" onClick={() => alert("Lien d'invitation bientôt dispo !")}>
    <div className="mode-info">
      <h3>Duel d'amis</h3>
      <p>Créez une salle privée et envoyez un lien de défi.</p>
    </div>
  </button>
</div>
          </>
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
  );
}