// src/backend-matchmaking/app.ts
import express, { Request, Response } from "express";
import { addToWaitlist, removeFromWaitlist, findOpponent } from "./services/waitlistService";
import jwt from "jsonwebtoken";
import axios from "axios";
import fs from "fs";

const app = express();
app.use(express.json());

// VÉRIFICATION STRICTE DE LA CONFIGURATION
if (!process.env.GAME_SERVICE_URL) {
  console.error("❌ CRITICAL ERROR: La variable d'environnement GAME_SERVICE_URL est manquante.");
  process.exit(1);
}
const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL;

if (!process.env.JWT_SECRET_FILE) {
  console.error("❌ CRITICAL ERROR: La variable JWT_SECRET_FILE n'est pas définie.");
  process.exit(1);
}

let JWT_SECRET: string;
try {
  JWT_SECRET = fs.readFileSync(process.env.JWT_SECRET_FILE, "utf8").trim();
  if (!JWT_SECRET) throw new Error("Le fichier secret est vide.");
} catch (err: any) {
  console.error(`❌ CRITICAL ERROR: Impossible de lire le secret JWT : ${err.message}`);
  process.exit(1);
}

console.log("✅ Configuration chargée avec succès. Lancement du service...");

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/matchmaking/join", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const token = authHeader.split(" ")[1];
  let userId: number;

  // 1. ÉTAPE 1 : Validation stricte du JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
    userId = Number(decoded.userId);
  } catch (error) {
    console.error("[Matchmaking] Échec d'authentification JWT:", error);
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }

  // 2. ÉTAPE 2 : Logique de Matchmaking
  try {
    // Ajout à la waitlist sécurisé (gère le fait d'y être déjà de manière transparente)
    await addToWaitlist(userId);
    console.log(`[Matchmaking] User #${userId} est dans la file d'attente.`);

    const opponent = await findOpponent(userId);

    if (opponent) {
      console.log(`[Matchmaking] Match trouvé ! Tentative d'établissement : #${userId} vs #${opponent.userId}`);
      
      try {
        // Demande de création de la partie au serveur de jeu
        const gameRes = await axios.post(`${GAME_SERVICE_URL}/internal/games`, {
          player1Id: userId,
          player2Id: opponent.userId,
        });

        // 🧹 Nettoyage : On supprime les deux joueurs de la file SEULEMENT si la partie a été créée avec succès
        await removeFromWaitlist(userId);
        await removeFromWaitlist(opponent.userId);

        console.log(`[Matchmaking] Partie créée avec succès. Joueurs retirés de la file d'attente.`);
        return res.status(201).json(gameRes.data);
      } catch (axiosError: any) {
        console.error("❌ [Matchmaking] Échec lors de la création de la partie par le Game Service :", axiosError.message);
        
        // On ne supprime personne de la waitlist pour qu'ils retentent leur chance lors du prochain cycle
        return res.status(502).json({
          error: "SERVER_ERROR"
        });
      }
    }

    // Aucun adversaire trouvé pour le moment
    return res.json({ waiting: true, message: "WAITING_FOR_OPPONENT" });
  } catch (error) {
    console.error("[Matchmaking] Erreur critique lors de l'exécution du matchmaking:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/matchmaking/leave", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string | number };
    const userId = Number(decoded.userId);
    
    await removeFromWaitlist(userId);
    console.log(`[Matchmaking] User #${userId} a quitté manuellement la file d'attente.`);
    return res.json({ message: "LEFT_QUEUE" });
  } catch (e) {
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }
});

app.listen(3001, () => console.log("Matchmaking service running on port 3001"));