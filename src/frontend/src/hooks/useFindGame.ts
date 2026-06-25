// frontend/src/hooks/useFindGame.ts
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { joinWaitlistApi, leaveWaitlistApi } from "../services/findGame";

export function useFindGame() {
  const { user, refreshUserStatus } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  // Gestion du Polling (le chrono de 3 secondes)
  useEffect(() => {
    let intervalId: number;

    if (isSearching && !user?.currentGame?.id) {
      intervalId = setInterval(async () => {
        try {
          // On rafraîchit le statut global pour voir si le backend nous a trouvé une partie
          await refreshUserStatus();
        } catch (err) {
          console.error("Erreur de synchronisation du matchmaking :", err);
        }
      }, 3000);
    }

    // Si une partie est détectée, on coupe la recherche
    if (user?.currentGame?.id && isSearching) {
      setIsSearching(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isSearching, user?.currentGame?.id, refreshUserStatus]);

  // Fonction pour lancer la recherche
  const startSearch = async () => {
    try {
      setError("");
      await joinWaitlistApi();
      setIsSearching(true);
    } catch (err: any) {
      setError(err.message || "Erreur lors du lancement de la recherche");
    }
  };

  // Fonction pour annuler la recherche
  const cancelSearch = async () => {
    try {
      await leaveWaitlistApi();
      setIsSearching(false);
    } catch (err: any) {
      console.error("Erreur lors de l'annulation :", err);
    }
  };

  return {
    isSearching,
    error,
    startSearch,
    cancelSearch,
  };
}