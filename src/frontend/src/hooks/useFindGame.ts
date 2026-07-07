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

  // 1. On ajoute un "Optional Chaining" (user?.currentGame?.id) 
  // pour que ça renvoie 'undefined' au lieu de crash si user est null
  if (isSearching && !user?.currentGame?.id) {
    intervalId = setInterval(async () => {
      try {
        await refreshUserStatus();
      } catch (err) {
        console.error("Erreur de synchronisation du matchmaking :", err);
      }
    }, 3000);
  }

  if (user?.currentGame?.id && isSearching) {
    setIsSearching(false);
  }

  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [isSearching, user, refreshUserStatus]); // 💡 Ajoute 'user' complet dans les dépendances

// Fonction pour lancer la recherche
const startSearch = async () => {
  try {
    // 2. LE CHECKSUM DE SÉCURITÉ : Si l'user n'est pas là, on arrête tout de suite.
    // TypeScript comprend alors que dans les lignes suivantes, 'user' ne PEUT PAS être null.
    if (!user || !user.id) {
      throw new Error("Vous devez être connecté pour jouer.");
    }

    setError("");
    await joinWaitlistApi(user.id); // 🔥 Ici, user.id est garanti 100% safe pour TS
    setIsSearching(true);
  } catch (err: any) {
    setError(err.message || "Erreur lors du lancement de la recherche");
  }
};

// Fonction pour annuler la recherche
const cancelSearch = async () => {
  try {
    if (!user || !user.id) return; // 3. Même sécurité ici

    await leaveWaitlistApi(user.id);
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
