// src/backend-matchmaking/app.ts
import express, { Request, Response } from "express";
import { addToWaitlist, removeFromWaitlist, findOpponent } from "./services/waitlistService";
import axios from "axios";

const app = express();
app.use(express.json());

const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || "http://backend:3000";

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/matchmaking/join", async (req: Request, res: Response) => {
  // 💡 Note : On simplifie l'extraction de l'ID utilisateur pour le test
  const userId = req.body.userId; 

  if (!userId) return res.status(400).json({ error: "userId requis" });

  try {
    await addToWaitlist(userId, "5+0");
    const opponent = await findOpponent(userId, "5+0");

    if (opponent) {
      // On demande au Game Engine de créer la partie
      const gameRes = await axios.post(`${GAME_SERVICE_URL}/internal/games`, {
        player1Id: userId,
        player2Id: opponent.userId,
        timeControl: "5+0"
      });

      // On nettoie la file d'attente locale
      await removeFromWaitlist(userId);
      await removeFromWaitlist(opponent.userId);

      return res.status(201).json(gameRes.data);
    }

    return res.json({ waiting: true, message: "En attente d'un adversaire..." });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Erreur Matchmaking" });
  }
});

app.post("/matchmaking/leave", async (req: Request, res: Response) => {
  const userId = req.body.userId;
  await removeFromWaitlist(userId);
  return res.json({ message: "Vous avez quitté la file d'attente." });
});

app.listen(3001, () => console.log("Matchmaking service running on port 3001"));