import { useState, useEffect } from "react";
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
  type FriendRequest,
} from "../../services/auth";
import "../../styles/Profile/ProfileOverlay.css";

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
  const { user, logout } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [friendFeedback, setFriendFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const isCurrentUserInGame = !!user?.currentGame?.id;

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
      setFriendFeedback({ ok: true, msg: data.message });
      setFriendUsername("");
      reload();
    } catch (err: any) {
      setFriendFeedback({ ok: false, msg: err.message });
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

        <img src={user.avatarUrl || defaultAvatarUrl} alt="Avatar" className="profile-avatar" />
        <h2 className="profile-title">Mon profil</h2>
        <p className="profile-subtitle">Informations de votre compte</p>

        <div className="profile-info">
          <strong className="profile-label">Pseudo</strong>
          <p className="profile-value">{user.username}</p>
          <strong className="profile-label">Email</strong>
          <p className="profile-value">{user.email || (user as any).mail || "Non renseigné"}</p>
        </div>

        <button className="profile-edit-button" onClick={() => setShowEdit(true)}>
          <ProfileIcon className="profile-icon" />
          <span>Modifier le profil</span>
        </button>

        {/* ── Demandes reçues ── */}
        {requests.length > 0 && (
          <div className="profile-friends-section">
            <span className="profile-label" style={{ display: "block", marginBottom: "0.5rem" }}>
              Demandes reçues ({requests.length})
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
            <span className="profile-label" style={{ marginTop: 0 }}>Amis ({friends.length})</span>
            <span className="profile-friends-toggle">{showAddFriend ? "−" : "+"}</span>
          </div>

          {showAddFriend && (
            <div className="profile-add-friend">
              <div className="profile-add-friend-row">
                <input
                  className="profile-add-friend-input"
                  type="text"
                  placeholder="Nom d'utilisateur..."
                  value={friendUsername}
                  onChange={(e) => { setFriendUsername(e.target.value); setFriendFeedback(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendRequest()}
                  autoFocus
                />
                <button className="profile-add-friend-btn" onClick={handleSendRequest}>
                  Envoyer
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
            <p className="profile-friends-empty">Chargement...</p>
          ) : friends.length === 0 ? (
            <p className="profile-friends-empty">Aucun ami pour l'instant.</p>
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
          <span>Logout</span>
        </button>
      </div>

      <ProfileEditOverlay isOpen={showEdit} onClose={() => setShowEdit(false)} />
    </div>
  );
}
