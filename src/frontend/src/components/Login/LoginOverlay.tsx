import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { login, register } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";
import { LegalModal, type LegalTab } from "../Legal/LegalModal";
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>("privacy");
  const { login: loginUser } = useAuth();
  const { t } = useTranslation();

  function resetFields() {
    setEmail("");
    setPassword("");
    setUsername("");
    setError("");
    setAcceptedTerms(false);
  }

  function openLegal(tab: LegalTab) {
    setLegalTab(tab);
    setLegalOpen(true);
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

      if (isRegister && !acceptedTerms) {
        setError(t("login.mustAcceptTerms"));
        return;
      }

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

        {isRegister && (
          <label className="login-terms-checkbox">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              <Trans i18nKey="login.acceptTerms">
                J'accepte les <button type="button" className="login-terms-link" onClick={() => openLegal("terms")}>CGU</button> et la <button type="button" className="login-terms-link" onClick={() => openLegal("privacy")}>politique de confidentialité</button>
              </Trans>
            </span>
          </label>
        )}

        <button
          type="submit"
          className="login-submit-button"
          disabled={isRegister && !acceptedTerms}
        >
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

      <LegalModal isOpen={legalOpen} initialTab={legalTab} onClose={() => setLegalOpen(false)} />
    </div>
  );
}