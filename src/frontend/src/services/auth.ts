// frontend/src/services/auth.ts

// Extracts the error code from an HTTP response. The code is translated at the
// display site via the `errors` namespace. Also handles a non-JSON body (e.g. 413 nginx).
async function extractErrorMessage(
  response: Response,
  fallbackCode: string,
): Promise<string> {
  try {
    const error = await response.json();
    return error.error || fallbackCode;
  } catch {
    if (response.status === 413) {
      return "FILE_TOO_LARGE";
    }
    return fallbackCode;
  }
}

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

export async function register(
  email: string,
  username: string,
  password: string,
) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "REGISTRATION_FAILED"));
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
    throw new Error(await extractErrorMessage(response, "LOGIN_FAILED"));
  }

  return response.json(); // Doit renvoyer { token: "..." }
}

// 💡 Nouvelle fonction pour récupérer le profil au démarrage de l'app ou refresh
export async function fetchMe() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: getAuthHeaders(), // Injecte le Bearer token
  });

  if (!response.ok) {
    // Si le token est invalide/expiré, on rejette pour nettoyer le stockage côté Context
    throw new Error("TOKEN_INVALID");
  }

  return response.json(); // Renvoie { userId: X, username: "Y", currentGameId: Z }
}

export async function updateProfile(fields: {
  username?: string;
  email?: string;
}) {
  const response = await fetch("/api/auth/profile", {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "SERVER_ERROR"),
    );
  }

  return response.json();
}

export async function sendFriendRequest(username: string) {
  const response = await fetch("/api/friends/request", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "SERVER_ERROR"));
  }

  return response.json();
}

export async function heartbeat(): Promise<void> {
  await fetch("/api/auth/heartbeat", { method: "POST", headers: getAuthHeaders() });
}

export async function getFriends(): Promise<{ id: number; username: string; avatarUrl: string | null; isOnline: boolean }[]> {
  const response = await fetch("/api/friends", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "SERVER_ERROR"));
  }

  return response.json();
}

export interface FriendRequest {
  id: number;
  sender: { id: number; username: string; avatarUrl: string | null };
  createdAt: string;
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const response = await fetch("/api/friends/requests", {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "SERVER_ERROR"));
  }

  return response.json();
}

export async function acceptFriendRequest(id: number) {
  const response = await fetch(`/api/friends/requests/${id}/accept`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "SERVER_ERROR"));
  }

  return response.json();
}

export async function rejectFriendRequest(id: number) {
  const response = await fetch(`/api/friends/requests/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, "SERVER_ERROR"));
  }

  return response.json();
}

export async function uploadAvatar(file: File) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch("/api/auth/avatar", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await extractErrorMessage(response, "SERVER_ERROR"),
    );
  }

  return response.json();
}
