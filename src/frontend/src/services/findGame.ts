// frontend/src/services/findGame.ts

// Fonction utilitaire interne pour injecter le token JWT
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Envoie la demande pour rejoindre la file d'attente
 */
export async function joinWaitlistApi(userId: string | number) {
  const response = await fetch("/api/lobby/join", {
    method: "POST",
    headers: getAuthHeaders(),
	body: JSON.stringify({ userId }),
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
export async function leaveWaitlistApi(userId: string | number) {
  const response = await fetch("/api/lobby/leave", {
    method: "POST",
    headers: getAuthHeaders(),
	body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Impossible de quitter la file d'attente");
  }

  return response.json();
}
