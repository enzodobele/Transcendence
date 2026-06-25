// frontend/src/services/lobby.ts

// Fonction utilitaire interne pour injecter le token JWT
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

/**
 * Envoie la demande pour rejoindre la file d'attente
 */
export async function joinWaitlistApi() {
  const response = await fetch("/api/lobby/join", {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Impossible de rejoindre la file d'attente");
  }

  return response.json(); 
}

/**
 * Envoie la demande pour quitter la file d'attente
 */
export async function leaveWaitlistApi() {
  const response = await fetch("/api/lobby/leave", {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Impossible de quitter la file d'attente");
  }

  return response.json();
}