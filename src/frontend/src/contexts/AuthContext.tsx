// frontend/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { fetchMe } from "../services/auth";

interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null;
  currentGame?: {
    id: number;
    status: string;
    timeControl: string;
    player1: { username: string };
    player2: { username: string };
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour valider le token et récupérer les infos fraîches du backend
  const refreshUserStatus = async () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken) {
      logout();
      setIsLoading(false);
      return;
    }

    try {
      // On interroge l'API /me
      const freshUserData = await fetchMe();

      setToken(storedToken);
      setUser(freshUserData);
    } catch (error) {
      console.error("Échec de la reconnexion automatique :", error);
      // Token invalide ou expiré -> on nettoie tout
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Charger et vérifier l'utilisateur au montage (refresh ou ouverture d'onglet)
  useEffect(() => {
    refreshUserStatus();
  }, []);

  const login = (userData: User, authToken: string) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem("token", authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    refreshUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
