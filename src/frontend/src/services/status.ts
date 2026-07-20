export interface ServiceStatus
{
  name: string;
  status: "online" | "degraded" | "offline";
  database?: string;
  uptime?: string;
}

export interface BackupStatus
{
  lastBackup: string | null;
  file?: string;
}

export interface SystemStatus
{
  services: ServiceStatus[];
  backup: BackupStatus;
  checkedAt: string;
}

export function getToken(): string | null
{
  return localStorage.getItem("token");
}

export function isAdminToken(token: string | null): boolean
{
  if (!token) return false;
  try
  {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return !!payload.isAdmin;
  }
  catch
  {
    return false;
  }
}

export async function fetchServices(token: string): Promise<ServiceStatus[]>
{
  const r = await fetch("/api/status/services", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function fetchBackupStatus(token: string): Promise<BackupStatus>
{
  const r = await fetch("/api/status/backup", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!r.ok) return { lastBackup: null };
  return r.json();
}

export async function triggerBackup(token: string): Promise<void>
{
  const r = await fetch("/api/status/backup", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Backup failed: HTTP ${r.status}`);
}

export async function fetchSystemStatus(token: string): Promise<SystemStatus>
{
  const [services, backup] = await Promise.all([
    fetchServices(token).catch(() => [] as ServiceStatus[]),
    fetchBackupStatus(token).catch(() => ({ lastBackup: null })),
  ]);

  return {
    services,
    backup,
    checkedAt: new Date().toISOString(),
  };
}
