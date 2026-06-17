import { useState } from "react";
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
    <div className="profile-container">
      <button
        className="profile-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        <img
          src={profileIcon}
          alt="profil"
          className="profile-icon"
        />
      </button>

      {showMenu && (
        <div className="profile-menu">
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
      )}
    </div>
  );
}
