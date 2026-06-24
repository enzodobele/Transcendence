import { useState } from "react";
import "../styles/ProfileButton.css";
import { useAuth } from "../contexts/AuthContext";
import profileIcon from "../assets/Logo/chessguard_profile_icon.svg";
import logoutIcon from "../assets/Logo/logout.svg";

export function ProfileButton() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <button
        className="profile-button"
        onClick={() => setShowMenu(true)}
      >
        <img
          src={profileIcon}
          alt="profil"
          className="profile-icon"
        />
      </button>

      {showMenu && (
        <div className="login-overlay" onClick={() => setShowMenu(false)}>
          <div className="login-content" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(false)}
              className="login-close-button"
            >
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

            <h2 className="login-title">Mon profil</h2>
            <p className="login-subtitle">Informations de votre compte</p>

            <div className="profile-info">
              <p className="profile-username">{user.username}</p>
              <p className="profile-email">{user.email}</p>
            </div>

            <button
              className="profile-logout-button"
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
            >
              <img
                src={logoutIcon}
                alt="déconnexion"
                className="logout-icon"
              />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </>
  );
}
