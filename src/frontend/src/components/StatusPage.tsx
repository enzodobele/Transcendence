import { useEffect, useMemo, useState } from "react";
import {
  getToken,
  isAdminToken,
  fetchSystemStatus,
  triggerBackup,
  type SystemStatus,
  type ServiceStatus,
} from "../services/status";
import "../styles/status.css";

const SERVICE_LABELS: Record<string, string> = {
  auth: "Auth",
  game: "Game Engine",
  matchmaking: "Matchmaking",
  friends: "Friends",
  ai: "IA",
};

function serviceClass(status: ServiceStatus["status"]): string
{
  if (status === "online") return "ok";
  if (status === "degraded") return "warn";
  return "ko";
}

function serviceLabel(status: ServiceStatus["status"]): string
{
  if (status === "online") return "Online";
  if (status === "degraded") return "Degraded";
  return "Offline";
}

export function StatusPage()
{
  const token = useMemo(() => getToken(), []);
  const isAdmin = useMemo(() => isAdminToken(token), [token]);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [isBacking, setIsBacking] = useState(false);

  const load = async (showLoader = false) =>
  {
    if (!token) return;
    if (showLoader) setIsLoading(true);
    const next = await fetchSystemStatus(token);
    setStatus(next);
    if (showLoader) setIsLoading(false);
  };

  useEffect(() =>
  {
    void load(true);
    const interval = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const handleBackup = async () =>
  {
    if (!token) return;
    setIsBacking(true);
    setBackupMsg(null);
    try
    {
      await triggerBackup(token);
      setBackupMsg("Backup effectué avec succès !");
      void load();
    }
    catch
    {
      setBackupMsg("Erreur lors du backup.");
    }
    finally
    {
      setIsBacking(false);
    }
  };

  const checkedAt = useMemo(() =>
  {
    if (!status?.checkedAt) return "-";
    return new Date(status.checkedAt).toLocaleString();
  }, [status?.checkedAt]);

  if (!isAdmin)
  {
    return (
      <main className="status-page">
        <section className="status-panel">
          <h1>ChessGuard Status</h1>
          <p className="subtitle">Accès réservé aux administrateurs.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="status-page">
      <section className="status-panel">
        <h1>ChessGuard Status</h1>
        <p className="subtitle">État en temps réel des microservices</p>

        {isLoading && !status ? (
          <p>Chargement du statut...</p>
        ) : (
          <>
            <ul className="status-list">
              {status?.services.map((svc) => (
                <li key={svc.name} className={serviceClass(svc.status)}>
                  <span>{SERVICE_LABELS[svc.name] ?? svc.name}</span>
                  <strong>{serviceLabel(svc.status)}</strong>
                </li>
              ))}
            </ul>

            <div className="meta">
              <p>
                Last backup:{" "}
                <strong>
                  {status?.backup.lastBackup
                    ? new Date(status.backup.lastBackup).toLocaleString()
                    : "Jamais"}
                </strong>
              </p>
              {status?.backup.file && (
                <p>Fichier: <strong>{status.backup.file}</strong></p>
              )}
              <p>Last check: <strong>{checkedAt}</strong></p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => void load()} className="refresh-btn">
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void handleBackup()}
                className="refresh-btn"
                disabled={isBacking}
              >
                {isBacking ? "Backup en cours..." : "Lancer un backup"}
              </button>
            </div>

            {backupMsg && (
              <p style={{ marginTop: 8, color: backupMsg.includes("Erreur") ? "#e55" : "#5e5" }}>
                {backupMsg}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
