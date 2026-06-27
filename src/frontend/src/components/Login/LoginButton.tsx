// src/frontend/src/components/Login/LoginButton.tsx
import LoginIcon from "../../assets/Logo/login.svg?react"; 
import "../../styles/Login/LoginButton.css";

interface LoginButtonProps {
  onClick: () => void;
}

export function LoginButton({ onClick }: LoginButtonProps) {
  return (
    <button className="login-button" onClick={onClick}>
      <LoginIcon className="login-logo" />
      <span>Connexion</span>
    </button>
  );
}