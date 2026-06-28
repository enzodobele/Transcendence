import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// 1. On crée un pool de connexion PostgreSQL natif
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. On l'associe à l'adaptateur Prisma 7
const adapter = new PrismaPg(pool);

// 3. On passe l'adaptateur au client
const prisma = new PrismaClient({ adapter });

export default prisma;
