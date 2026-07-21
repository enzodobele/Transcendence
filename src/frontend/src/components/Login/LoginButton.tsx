import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Login } from "./LoginOverlay";
import LoginIcon from "../../assets/Logo/login.svg?react";
import "../../styles/Login/LoginButton.css";

export function LoginButton() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button className="login-button" onClick={() => setIsLoginOpen(true)}>
        <LoginIcon className="login-logo" />
        <span>{t("login.connexion")}</span>
      </button>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}