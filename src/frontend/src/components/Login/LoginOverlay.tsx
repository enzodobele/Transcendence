import { useState } from "react";
import { login, register } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/Login/LoginOverlay.css";

interface LoginProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Login({ isOpen, onClose }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const { login: loginUser } = useAuth();

  function resetFields() {
    setEmail("");
    setPassword("");
    setUsername("");
    setError("");
  }

  function handleCloseAll() {
    setIsRegister(false);
    resetFields();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setError("");

      if (isRegister) {
        const data = await register(email, username, password);
        console.log(data);
        if (data.user && data.token) {
          loginUser(data.user, data.token);
          resetFields();
          onClose();
        }
      } else {
        const data = await login(email, password);
        console.log(data);
        if (data.user && data.token) {
          loginUser(data.user, data.token);
          resetFields();
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || "Utilisateur introuvable");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="login-overlay" onClick={handleCloseAll}>
      <form 
        className="login-content" 
        onSubmit={handleSubmit} 
        onClick={(e) => e.stopPropagation()}
      >
        
        <button type="button" onClick={handleCloseAll} className="login-close-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <h2 className="login-title">
          {isRegister ? "Créer un compte" : "Bon retour"}
        </h2>

        <p className="login-subtitle">
          {isRegister
            ? "Créez un compte pour jouer en ligne"
            : "Connectez-vous pour jouer en ligne"}
        </p>

        {error && <p className="login-error">{error}</p>}

        {isRegister && (
          <>
            <strong className="login-label">Pseudo</strong>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="JonDoe"
              className="login-input login-input-username"
            />
          </>
        )}

        <strong className="login-label">Email</strong>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          className="login-input"
        />

        <strong className="login-label login-password-label">
          Mot de passe
        </strong>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="login-input"
        />

        <button type="submit" className="login-submit-button">
          {isRegister ? "Créer un compte" : "Se connecter"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            resetFields();
          }}
          className="login-switch-button"
        >
          {isRegister
            ? "Déjà un compte ? Se connecter"
            : "Pas encore de compte ? S'inscrire"}
        </button>
      </form>
    </div>
  );
}