import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
    } catch (err) {
      setError(t("errors." + (err instanceof Error ? err.message : "GENERIC"), { defaultValue: t("errors.GENERIC") }));
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
          {isRegister ? t("login.createAccount") : t("login.welcomeBack")}
        </h2>

        <p className="login-subtitle">
          {isRegister
            ? t("login.subtitleRegister")
            : t("login.subtitleLogin")}
        </p>

        {error && <p className="login-error">{error}</p>}

        {isRegister && (
          <>
            <strong className="login-label">{t("login.pseudo")}</strong>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.usernamePlaceholder")}
              className="login-input login-input-username"
            />
          </>
        )}

        <strong className="login-label">{t("login.email")}</strong>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("login.emailPlaceholder")}
          className="login-input"
        />

        <strong className="login-label login-password-label">
          {t("login.password")}
        </strong>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="login-input"
        />

        <button type="submit" className="login-submit-button">
          {isRegister ? t("login.createAccount") : t("login.signIn")}
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
            ? t("login.switchToLogin")
            : t("login.switchToRegister")}
        </button>
      </form>
    </div>
  );
}