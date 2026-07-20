import { useEffect, useMemo, useState } from "react";
import { fetchSystemStatus, type SystemStatus } from "../services/status";
import "../styles/status.css";

type BackendState = "online" | "degraded" | "offline";

function statusLabel(isOnline: boolean): string {
  return isOnline ? "Online" : "Offline";
}

function statusClass(isOnline: boolean): string {
  return isOnline ? "ok" : "ko";
}

function backendLabel(state: BackendState): string {
  if (state === "online") {
    return "Online";
  }

  if (state === "degraded") {
    return "Degraded";
  }

  return "Offline";
}

function backendClass(state: BackendState): string {
  if (state === "online") {
    return "ok";
  }

  if (state === "degraded") {
    return "warn";
  }

  return "ko";
}

export function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (showLoader = false) => {
    if (showLoader) {
      setIsLoading(true);
    }

    const next = await fetchSystemStatus();
    setStatus(next);

    if (showLoader) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
    const interval = window.setInterval(() => {
      void load();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const checkedAt = useMemo(() => {
    if (!status?.checkedAt) {
      return "-";
    }
    return new Date(status.checkedAt).toLocaleString();
  }, [status?.checkedAt]);

  return (
    <main className="status-page">
      <section className="status-panel">
        <h1>ChessGuard Status</h1>
        <p className="subtitle">Etat en temps reel des services critiques</p>

        {isLoading && !status ? (
          <p>Chargement du statut...</p>
        ) : (
          <>
            <ul className="status-list">
              <li className={backendClass(status?.backendState ?? "offline")}>
                <span>Backend</span>
                <strong>{backendLabel(status?.backendState ?? "offline")}</strong>
              </li>
              <li className={statusClass(!!status?.databaseOnline)}>
                <span>Database</span>
                <strong>{statusLabel(!!status?.databaseOnline)}</strong>
              </li>
              <li className={statusClass(!!status?.webSocketOnline)}>
                <span>WebSocket</span>
                <strong>{statusLabel(!!status?.webSocketOnline)}</strong>
              </li>
            </ul>

            <div className="meta">
              <p>Uptime backend: <strong>{status?.uptime ?? "unknown"}</strong></p>
              <p>Last backup: <strong>{status?.lastBackup ?? "never"}</strong></p>
              <p>Last check: <strong>{checkedAt}</strong></p>
            </div>

            <button type="button" onClick={() => void load()} className="refresh-btn">
              Refresh
            </button>
          </>
        )}
      </section>
    </main>
  );
}
