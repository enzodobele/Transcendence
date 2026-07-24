import * as path from "path";
import { execSync } from "child_process";
import * as fs from "fs";

export const BACKUP_DIR = "/backups";
export const BACKUP_STATUS_FILE = path.join(BACKUP_DIR, "backup-status.json");
export const MAX_BACKUPS = 7;
export const BACKUP_FILENAME_RE = /^chessguard_\d{8}_\d{6}\.sql\.gz$/;

// Reduce any caller-supplied name to a bare, format-checked basename so a
// restore request can never escape BACKUP_DIR.
export function validateBackupFilename(file: string): string {
  const base = path.basename(file);
  if (!BACKUP_FILENAME_RE.test(base)) {
    throw new Error(`Invalid backup filename: ${file}`);
  }
  return base;
}

// Names sort chronologically because the timestamp is zero-padded, so the
// oldest files are the leading slice once we exceed the retention limit.
export function selectForPruning(files: string[], max: number): string[] {
  const sorted = files.filter((f) => f.endsWith(".sql.gz")).sort();
  return sorted.slice(0, Math.max(0, sorted.length - max));
}

const DB_HOST = process.env.DB_HOST ?? "chessguard-db";
const APP_SECRETS_DIR = "/tmp/app-secrets";

// The service process gets *_FILE from the entrypoint; a `docker compose exec`
// CLI does not, so fall back to the known materialized-secret paths.
function readSecret(envVar: string, fallbackFile: string): string {
  const filePath = process.env[envVar] ?? path.join(APP_SECRETS_DIR, fallbackFile);
  const value = fs.readFileSync(filePath, "utf8").trim();
  if (!value) throw new Error(`Empty secret: ${filePath}`);
  return value;
}

function dbCreds(): { user: string; name: string; password: string } {
  return {
    user: readSecret("DB_USER_FILE", "db_user"),
    name: readSecret("DB_NAME_FILE", "db_name"),
    password: readSecret("DB_PASSWORD_FILE", "db_password"),
  };
}

export function runBackup(): { file: string; lastBackup: string } {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "");
  const filename = `chessguard_${ts}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);
  const { user, name, password } = dbCreds();

  try {
    // pipefail so a failed pg_dump fails the command instead of leaving a
    // 0-byte gzip that looks like a successful backup.
    execSync(
      `set -o pipefail; pg_dump -h ${DB_HOST} -U ${user} -d ${name} | gzip > ${filepath}`,
      { shell: "/bin/sh", env: { ...process.env, PGPASSWORD: password } },
    );
  } catch (err) {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    throw err;
  }

  if (!fs.existsSync(filepath) || fs.statSync(filepath).size === 0) {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    throw new Error("Backup produced an empty file");
  }

  const lastBackup = now.toISOString();
  fs.writeFileSync(
    BACKUP_STATUS_FILE,
    JSON.stringify({ lastBackup, file: filename }, null, 2),
  );

  for (const f of selectForPruning(fs.readdirSync(BACKUP_DIR), MAX_BACKUPS)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
  }

  console.log(`[backup] Terminé : ${filename}`);
  return { file: filename, lastBackup };
}

export function listBackups(): string[] {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => BACKUP_FILENAME_RE.test(f))
    .sort()
    .reverse();
}

export function runRestore(file: string): void {
  const base = validateBackupFilename(file);
  const filepath = path.join(BACKUP_DIR, base);
  if (!fs.existsSync(filepath)) throw new Error(`Backup not found: ${base}`);

  const { user, name, password } = dbCreds();
  const env = { ...process.env, PGPASSWORD: password };

  execSync(
    `psql -h ${DB_HOST} -U ${user} -d ${name} ` +
      `-c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
    { shell: "/bin/sh", env },
  );
  execSync(
    `set -o pipefail; gunzip -c ${filepath} | psql -h ${DB_HOST} -U ${user} -d ${name}`,
    { shell: "/bin/sh", env },
  );

  console.log(`[restore] Terminé : ${base}`);
}
