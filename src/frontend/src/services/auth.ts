// frontend/src/services/auth.ts

// Fonction utilitaire pour récupérer les headers avec le token JWT automatiquement
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function register(email: string, username: string, password: string) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de l'inscription");
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la connexion");
  }

  return response.json(); // Doit renvoyer { token: "..." }
}

// 💡 Nouvelle fonction pour récupérer le profil au démarrage de l'app ou refresh
export async function fetchMe() {
  const response = await fetch("/api/lobby/me", { // Ajuste le préfixe si ta route est /api/me
    method: "GET",
    headers: getAuthHeaders(), // Injecte le Bearer token
  });

  if (!response.ok) {
    // Si le token est invalide/expiré, on rejette pour nettoyer le stockage côté Context
    throw new Error("Session expirée ou invalide");
  }

  return response.json(); // Renvoie { userId: X, username: "Y", currentGameId: Z }
}