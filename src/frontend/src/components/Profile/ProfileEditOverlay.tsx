import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { updateProfile, uploadAvatar } from "../../services/auth";
import defaultAvatarUrl from "../../assets/Logo/default-avatar.svg";
import "../../styles/Profile/ProfileEditOverlay.css";

interface ProfileEditOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditOverlay({ isOpen, onClose }: ProfileEditOverlayProps) {
  const { t } = useTranslation();
  const { user, refreshUserStatus } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
      setEmail(user.email);
      setError("");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      await updateProfile({ username, email });
      await refreshUserStatus();
      onClose();
    } catch (err) {
      setError(t("errors." + (err instanceof Error ? err.message : "GENERIC"), { defaultValue: t("errors.GENERIC") }));
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarError("");
      await uploadAvatar(file);
      await refreshUserStatus();
    } catch (err) {
      setAvatarError(t("errors." + (err instanceof Error ? err.message : "GENERIC"), { defaultValue: t("errors.GENERIC") }));
    }
  }

  return (
    <div
      className="profile-edit-overlay"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <form
        className="profile-edit-content"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} className="profile-edit-close-button">
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

        <h2 className="profile-edit-title">{t("profile.editProfile")}</h2>
        <p className="profile-edit-subtitle">{t("profile.editSubtitle")}</p>

        {error && <p className="profile-edit-error">{error}</p>}

        <img
          src={user.avatarUrl || defaultAvatarUrl}
          alt={t("profile.currentAvatarAlt")}
          className="profile-edit-avatar-preview"
        />
        <label className="profile-edit-label" htmlFor="avatar-input">
          {t("profile.avatarAlt")}
        </label>
        <input
          id="avatar-input"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleAvatarChange}
          className="profile-edit-input"
        />
        {avatarError && <p className="profile-edit-error">{avatarError}</p>}

        <strong className="profile-edit-label">{t("profile.pseudo")}</strong>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="profile-edit-input"
        />

        <strong className="profile-edit-label">{t("profile.email")}</strong>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="profile-edit-input"
        />

        <button type="submit" className="profile-edit-submit-button">
          {t("profile.save")}
        </button>
      </form>
    </div>
  );
}
