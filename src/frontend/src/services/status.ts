export interface HealthPayload {
  status: "ok" | "degraded" | "down";
  database: "connected" | "disconnected";
  uptime: string;
}

type BackendState = "online" | "degraded" | "offline";

export interface BackupStatusPayload {
  lastBackup: string | null;
  file?: string;
}

export interface SystemStatus {
  backendState: BackendState;
  databaseOnline: boolean;
  webSocketOnline: boolean;
  uptime: string;
  lastBackup: string;
  checkedAt: string;
}

async function getHealth(): Promise<{ payload: HealthPayload | null; reachable: boolean } | null> {
  try {
    const response = await fetch("/api/status/health", { cache: "no-store" });
    let payload: HealthPayload | null = null;

    try {
      payload = (await response.json()) as HealthPayload;
    } catch {
      payload = null;
    }

    return {
      payload,
      reachable: true,
    };
  } catch {
    return null;
  }
}

async function getBackupStatus(): Promise<BackupStatusPayload | null> {
  try {
    const response = await fetch("/backup-status.json", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BackupStatusPayload;
  } catch {
    return null;
  }
}

export async function checkWebSocketOnline(): Promise<boolean> {
  try {
    const response = await fetch("/api/status/ws", { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const [health, backup, webSocketOnline] = await Promise.all([
    getHealth(),
    getBackupStatus(),
    checkWebSocketOnline(),
  ]);

  const healthPayload = health?.payload ?? null;
  const backendState: BackendState =
    !health || !health.reachable
      ? "offline"
      : healthPayload?.status === "degraded"
      ? "degraded"
      : "online";

  return {
    backendState,
    databaseOnline: healthPayload?.database === "connected",
    webSocketOnline,
    uptime: healthPayload?.uptime ?? "unknown",
    lastBackup: backup?.lastBackup ?? "never",
    checkedAt: new Date().toISOString(),
  };
}
