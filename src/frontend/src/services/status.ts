export interface HealthPayload {
  status: "ok" | "degraded" | "down";
  database: "connected" | "disconnected";
  uptime: string;
}

export interface BackupStatusPayload {
  lastBackup: string | null;
  file?: string;
}

export interface SystemStatus {
  backendOnline: boolean;
  databaseOnline: boolean;
  webSocketOnline: boolean;
  uptime: string;
  lastBackup: string;
  checkedAt: string;
}

async function getHealth(): Promise<HealthPayload | null> {
  try {
    const response = await fetch("/api/status/health", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as HealthPayload;
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

export function checkWebSocketOnline(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let settled = false;
    let opened = false;
    let ws: WebSocket | null = null;

    const finish = (online: boolean) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }

      resolve(online);
    };

    const timeoutId = window.setTimeout(() => finish(false), timeoutMs);

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        opened = true;
        finish(true);
      };

      ws.onerror = () => finish(false);

      ws.onclose = () => {
        finish(opened);
      };
    } catch {
      finish(false);
    }
  });
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const [health, backup, webSocketOnline] = await Promise.all([
    getHealth(),
    getBackupStatus(),
    checkWebSocketOnline(),
  ]);

  return {
    backendOnline: !!health,
    databaseOnline: health?.database === "connected",
    webSocketOnline,
    uptime: health?.uptime ?? "unknown",
    lastBackup: backup?.lastBackup ?? "never",
    checkedAt: new Date().toISOString(),
  };
}
