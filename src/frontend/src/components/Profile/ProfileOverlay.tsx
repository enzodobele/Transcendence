import { useAuth } from "../../contexts/AuthContext";
import LogoutIcon from "../../assets/Logo/logout.svg?react";
import "../../styles/Profile/ProfileOverlay.css";

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-content" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} className="profile-close-button">
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

        <h2 className="profile-title">Mon profil</h2>
        <p className="profile-subtitle">Informations de votre compte</p>

        <div className="profile-info">
          <strong className="profile-label">Pseudo</strong>
          <p className="profile-value">{user.username}</p>
          
          <strong className="profile-label">Email</strong>
          {/* <p className="profile-value">{user.email}</p> */}
		  <p className="profile-value">{user.email || (user as any).mail || "Non renseigné"}</p>
        </div>

        <button
          className="profile-logout-button"
          onClick={() => {
            logout();
            onClose();
          }}
        >
          <LogoutIcon className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}