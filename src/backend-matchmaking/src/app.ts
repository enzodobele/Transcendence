// src/backend-matchmaking/app.ts
import express, { Request, Response } from "express";
import { addToWaitlist, removeFromWaitlist, findOpponent } from "./services/waitlistService";
import jwt from "jsonwebtoken"; // 👈 Ajout pour la validation de l'identité
import axios from "axios";
import fs from "fs";

const app = express();
app.use(express.json());

// =========================================================================
// 🚨 VÉRIFICATION STRICTE DE LA CONFIGURATION (FAIL-FAST)
// =========================================================================

// 1. Validation de la variable GAME_SERVICE_URL
if (!process.env.GAME_SERVICE_URL) {
  console.error("❌ CRITICAL ERROR: La variable d'environnement GAME_SERVICE_URL est manquante.");
  process.exit(1);
}
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL;

// 2. Validation et lecture du Secret JWT
if (!process.env.JWT_SECRET_FILE) {
  console.error("❌ CRITICAL ERROR: La variable JWT_SECRET_FILE n'est pas définie.");
  process.exit(1);
}

if (!fs.existsSync(process.env.JWT_SECRET_FILE)) {
  console.error(`❌ CRITICAL ERROR: Le fichier secret requis n'existe pas à l'emplacement : ${process.env.JWT_SECRET_FILE}`);
  process.exit(1);
}

let JWT_SECRET: string;
try {
  JWT_SECRET = fs.readFileSync(process.env.JWT_SECRET_FILE, "utf8").trim();
  if (!JWT_SECRET) {
    throw new Error("Le fichier secret est vide.");
  }
} catch (err: any) {
  console.error(`❌ CRITICAL ERROR: Impossible de lire le secret JWT : ${err.message}`);
  process.exit(1);
}

console.log("✅ Configuration chargée avec succès. Lancement du service...");
// =========================================================================


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/matchmaking/join", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
    
    // 🎯 ON LE FIXE EN NUMBER ICI, UNE FOIS POUR TOUTES !
    const userId = Number(decoded.userId); 
    console.log(`[Matchmaking] Jeton validé pour l'userId (number): ${userId}`);

    // À partir d'ici, 'userId' est un pur 'number'. Plus besoin de conversion !
    await addToWaitlist(userId, "5+0");
    const opponent = await findOpponent(userId, "5+0");

    if (opponent) {
      const gameRes = await axios.post(`${GAME_SERVICE_URL}/internal/games`, {
        player1Id: userId,
        player2Id: opponent.userId,
        timeControl: "5+0"
      });

      await removeFromWaitlist(userId);
      await removeFromWaitlist(opponent.userId);

      return res.status(201).json(gameRes.data);
    }

    return res.json({ waiting: true, message: "En attente d'un adversaire..." });
  } catch (error) {
    console.error("[Matchmaking] Échec:", error);
    return res.status(401).json({ error: "Session expirée ou jeton invalide" });
  }
});

app.post("/matchmaking/leave", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      // 1. On décode (on accepte string | number pour être safe avec le payload de l'auth)
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
      
      // 2. On fixe la variable en number une bonne fois pour toutes 🎯
      const userId = Number(decoded.userId);
      
      // 3. Plus aucun problème, c'est un pur number !
      await removeFromWaitlist(userId);
      return res.json({ message: "Vous avez quitté la file d'attente." });
    } catch (e) {
      return res.status(401).json({ error: "Jeton invalide" });
    }
  }

  return res.status(401).json({ error: "Non autorisé" });
});

app.listen(3001, () => console.log("Matchmaking service running on port 3001"));