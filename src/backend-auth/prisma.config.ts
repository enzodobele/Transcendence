// Prisma configuration file for the backend-auth service
import { defineConfig } from '@prisma/config';
import fs from 'fs';

// Fonction utilitaire pour lire un secret Docker
function readSecret(filePath: string | undefined): string {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8').trim();
}

// Reconstitution dynamique de la DATABASE_URL à partir des secrets Docker
const dbUser = readSecret(process.env.DB_USER_FILE);
const dbPassword = readSecret(process.env.DB_PASSWORD_FILE);
const dbName = readSecret(process.env.DB_NAME_FILE);

const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
});