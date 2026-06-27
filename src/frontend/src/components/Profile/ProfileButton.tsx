import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ProfileOverlay } from "./ProfileOverlay";
import ProfileIcon from "../../assets/Logo/profile.svg?react";
import "../../styles/Profile/ProfileButton.css";

export function ProfileButton() {
  const { user, isAuthenticated } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <button className="profile-button" onClick={() => setShowMenu(true)}>
        <ProfileIcon className="profile-icon" />
      </button>

      <ProfileOverlay isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}