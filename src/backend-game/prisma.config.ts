// Prisma configuration file for the backend-game service
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
