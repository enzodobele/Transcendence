import { useState } from "react";
import { Login } from "./LoginOverlay";
import LoginIcon from "../../assets/Logo/login.svg?react"; 
import "../../styles/Login/LoginButton.css";

export function LoginButton() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <>
      <button className="login-button" onClick={() => setIsLoginOpen(true)}>
        <LoginIcon className="login-logo" />
        <span>Connexion</span>
      </button>

      <Login isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}