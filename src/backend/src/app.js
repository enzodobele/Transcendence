const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Middleware pour gérer les erreurs de connexion à la base de données
app.use(async (req, res, next) => {
  try {
    await prisma.$connect();
    next();
  } catch (err) {
    console.error("Erreur de connexion à la base de données :", err);
    res.status(500).json({ error: "Impossible de se connecter à la base de données" });
  }
});

// Route de test pour vérifier la connexion
app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Démarre le serveur
app.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});

// Gère la fermeture propre du serveur
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});