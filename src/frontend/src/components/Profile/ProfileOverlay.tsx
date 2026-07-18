import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import LogoutIcon from "../../assets/Logo/logout.svg?react";
import ProfileIcon from "../../assets/Logo/profile.svg?react";
import defaultAvatarUrl from "../../assets/Logo/default-avatar.svg";
import { ProfileEditOverlay } from "./ProfileEditOverlay";
import {
  sendFriendRequest,
  getFriends,
  getIncomingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteAccount,
  type FriendRequest,
} from "../../services/auth";
import "../../styles/Profile/ProfileOverlay.css";
import { LegalLinks } from "../Legal/LegalLinks";


interface Friend {
  id: number;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
  currentGameId?: number | null;
}

interface ProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileOverlay({ isOpen, onClose }: ProfileOverlayProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [friendFeedback, setFriendFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reload = () => {
    getFriends().then(setFriends).catch(() => {});
    getIncomingRequests().then(setRequests).catch(() => {});
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([getFriends(), getIncomingRequests()])
      .then(([f, r]) => { setFriends(f); setRequests(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleSendRequest = async () => {
    if (!friendUsername.trim()) return;
    try {
      const data = await sendFriendRequest(friendUsername.trim());
      setFriendFeedback({ ok: true, msg: t("errors." + (data.message ?? "GENERIC"), { defaultValue: t("errors.GENERIC") }) });
      setFriendUsername("");
      reload();
    } catch (err) {
      setFriendFeedback({ ok: false, msg: t("errors." + (err instanceof Error ? err.message : "GENERIC"), { defaultValue: t("errors.GENERIC") }) });
    }
  };

  const handleAccept = async (id: number) => {
    await acceptFriendRequest(id).catch(() => {});
    reload();
  };

  const handleReject = async (id: number) => {
    await rejectFriendRequest(id).catch(() => {});
    reload();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      logout();
      onClose();
    } catch (err) {
      const code = err instanceof Error ? err.message : "GENERIC";
      setDeleteError(t("errors." + code, { defaultValue: t("errors.GENERIC") }));
      setIsDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-content" onClick={(e) => e.stopPropagation()}>

        <button onClick={onClose} className="profile-close-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <img src={user.avatarUrl || defaultAvatarUrl} alt={t("profile.avatarAlt")} className="profile-avatar" />
        <h2 className="profile-title">{t("profile.title")}</h2>
        <p className="profile-subtitle">{t("profile.subtitle")}</p>

        <div className="profile-info">
          <strong className="profile-label">{t("profile.pseudo")}</strong>
          <p className="profile-value">{user.username}</p>
          <strong className="profile-label">{t("profile.email")}</strong>
          <p className="profile-value">{user.email || (user as any).mail || t("profile.notProvided")}</p>
        </div>

        <button className="profile-edit-button" onClick={() => setShowEdit(true)}>
          <ProfileIcon className="profile-icon" />
          <span>{t("profile.editProfile")}</span>
        </button>

        {/* ── Demandes reçues ── */}
        {requests.length > 0 && (
          <div className="profile-friends-section">
            <span className="profile-label" style={{ display: "block", marginBottom: "0.5rem" }}>
              {t("profile.incomingRequests", { n: requests.length })}
            </span>
            <ul className="profile-friends-list">
              {requests.map((r) => (
                <li key={r.id} className="profile-friend-item">
                  <img src={r.sender.avatarUrl || defaultAvatarUrl} alt={r.sender.username} className="profile-friend-avatar" />
                  <span className="profile-friend-name">{r.sender.username}</span>
                  <div className="profile-request-actions">
                    <button className="profile-request-btn accept" onClick={() => handleAccept(r.id)}>✓</button>
                    <button className="profile-request-btn reject" onClick={() => handleReject(r.id)}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Amis ── */}
        <div className="profile-friends-section">
          <div className="profile-friends-header" onClick={() => { setShowAddFriend(!showAddFriend); setFriendFeedback(null); }}>
            <span className="profile-label" style={{ marginTop: 0 }}>{t("profile.friends", { n: friends.length })}</span>
            <span className="profile-friends-toggle">{showAddFriend ? "−" : "+"}</span>
          </div>

          {showAddFriend && (
            <div className="profile-add-friend">
              <div className="profile-add-friend-row">
                <input
                  className="profile-add-friend-input"
                  type="text"
                  placeholder={t("profile.addFriendPlaceholder")}
                  value={friendUsername}
                  onChange={(e) => { setFriendUsername(e.target.value); setFriendFeedback(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                  autoFocus
                />
                <button className="profile-add-friend-btn" onClick={handleSendRequest}>
                  {t("profile.send")}
                </button>
              </div>
              {friendFeedback && (
                <p className={`profile-friend-feedback ${friendFeedback.ok ? "ok" : "err"}`}>
                  {friendFeedback.msg}
                </p>
              )}
            </div>
          )}

          {loading ? (
            <p className="profile-friends-empty">{t("profile.loadingFriends")}</p>
          ) : friends.length === 0 ? (
            <p className="profile-friends-empty">{t("profile.noFriends")}</p>
          ) : (
            <ul className="profile-friends-list">
              {friends.map((f) => (
                <li key={f.id} className="profile-friend-item">
                  <img src={f.avatarUrl || defaultAvatarUrl} alt={f.username} className="profile-friend-avatar" />
                  <span className="profile-friend-name">{f.username}</span>
                  <span className={`profile-presence-dot ${f.isOnline ? "online" : "offline"}`} />
                  {f.currentGameId && f.isOnline && !isCurrentUserInGame && (
                    <button
                      className="profile-request-btn accept"
                      onClick={() => window.location.assign(`/spectate?gameId=${f.currentGameId}`)}
                    >
                      Spectate
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="profile-logout-button"
		onClick={() => {
			logout();
			onClose();
			window.location.replace("/");
		}}>
          <LogoutIcon className="logout-icon" />
          <span>{t("profile.logout")}</span>
        </button>

        {!showDeleteConfirm ? (
          <button
            className="profile-delete-account-button"
            onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
          >
            {t("profile.deleteAccount")}
          </button>
        ) : (
          <div className="profile-delete-confirm">
            <p className="profile-delete-confirm-text">
              {t("profile.deleteConfirmText")}
            </p>
            {deleteError && <p className="profile-delete-error">{deleteError}</p>}
            <div className="profile-delete-confirm-actions">
              <button
                className="profile-delete-confirm-no"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                {t("common.no")}
              </button>
              <button
                className="profile-delete-confirm-yes"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t("profile.deleting") : t("common.yes")}
              </button>
            </div>
          </div>
        )}
      <LegalLinks />

      </div>

      <ProfileEditOverlay isOpen={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  );
}