// Prisma configuration file for the backend-matchmaking service
import { defineConfig } from '@prisma/config';

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
