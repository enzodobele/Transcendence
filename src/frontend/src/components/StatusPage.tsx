import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getToken,
  isAdminToken,
  fetchSystemStatus,
  triggerBackup,
  type SystemStatus,
  type ServiceStatus,
} from "../services/status";
import "../styles/status.css";

function serviceClass(status: ServiceStatus["status"]): string
{
  if (status === "online") return "ok";
  if (status === "degraded") return "warn";
  return "ko";
}

function serviceStateKey(status: ServiceStatus["status"]): string
{
  if (status === "online") return "status.state.online";
  if (status === "degraded") return "status.state.degraded";
  return "status.state.offline";
}

interface BackupMessage {
  text: string;
  isError: boolean;
}

export function StatusPage()
{
  const { t } = useTranslation();
  const token = useMemo(() => getToken(), []);
  const isAdmin = useMemo(() => isAdminToken(token), [token]);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backupMsg, setBackupMsg] = useState<BackupMessage | null>(null);
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
      setBackupMsg({ text: t("status.backupSuccess"), isError: false });
      void load();
    }
    catch
    {
      setBackupMsg({ text: t("status.backupError"), isError: true });
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
          <h1>{t("status.title")}</h1>
          <p className="subtitle">{t("status.adminOnly")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="status-page">
      <section className="status-panel">
        <h1>{t("status.title")}</h1>
        <p className="subtitle">{t("status.subtitle")}</p>

        {isLoading && !status ? (
          <p>{t("status.loading")}</p>
        ) : (
          <>
            <ul className="status-list">
              {status?.services.map((svc) => (
                <li key={svc.name} className={serviceClass(svc.status)}>
                  <span>{t(`status.services.${svc.name}`, { defaultValue: svc.name })}</span>
                  <strong>{t(serviceStateKey(svc.status))}</strong>
                </li>
              ))}
            </ul>

            <div className="meta">
              <p>
                {t("status.lastBackup")}{" "}
                <strong>
                  {status?.backup.lastBackup
                    ? new Date(status.backup.lastBackup).toLocaleString()
                    : t("status.never")}
                </strong>
              </p>
              {status?.backup.file && (
                <p>{t("status.file")} <strong>{status.backup.file}</strong></p>
              )}
              <p>{t("status.lastCheck")} <strong>{checkedAt}</strong></p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={() => void load()} className="refresh-btn">
                {t("status.refresh")}
              </button>
              <button
                type="button"
                onClick={() => void handleBackup()}
                className="refresh-btn"
                disabled={isBacking}
              >
                {isBacking ? t("status.backupInProgress") : t("status.runBackup")}
              </button>
            </div>

            {backupMsg && (
              <p style={{ marginTop: 8, color: backupMsg.isError ? "#e55" : "#5e5" }}>
                {backupMsg.text}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}
