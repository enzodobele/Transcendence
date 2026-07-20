/// <reference types="node" />

// Prisma configuration file for the backend-auth service
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
});