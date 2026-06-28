// src/backend/src/controllers/waitlistController.ts
import { Request, Response } from "express";
import prisma from "../prisma";
import {
  addToWaitlist,
  removeFromWaitlist,
  findOpponent,
} from "../services/waitlistService";

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Ajoute un utilisateur à la file d'attente
export const joinWaitlist = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    // Vérifie si l'utilisateur est déjà dans la file
    const existing = await prisma.waitlistEntry.findUnique({
      where: { userId },
    });
    if (existing) {
      return res.json({
        waiting: true,
        message: "Déjà dans la file d'attente.",
      });
    }

    // Ajoute l'utilisateur à la waitlist
    await addToWaitlist(userId, "5+0");

    // Cherche un adversaire
    const opponent = await findOpponent(userId, "5+0");
    if (opponent) {
      // TRANSACTION PRISMA : Création du match + Assignation du currentGameId aux deux joueurs
      const game = await prisma.$transaction(async (tx) => {
        // 1. Crée la partie
        const newGame = await tx.game.create({
          data: {
            player1Id: userId,
            player2Id: opponent.userId,
            fenString: INITIAL_FEN,
            timeControl: "5+0",
            status: "en_cours",
          },
        });

        // 2. Assigne la partie en cours au joueur 1
        await tx.user.update({
          where: { id: userId },
          data: { currentGameId: newGame.id },
        });

        // 3. Assigne la partie en cours au joueur 2
        await tx.user.update({
          where: { id: opponent.userId },
          data: { currentGameId: newGame.id },
        });

        return newGame;
      });

      // Retire définitivement les deux joueurs de la file
      await removeFromWaitlist(userId);
      await removeFromWaitlist(opponent.userId);

      // On récupère les usernames pour correspondre à la structure attendue par App.tsx
      const p1 = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      });
      const p2 = await prisma.user.findUnique({
        where: { id: opponent.userId },
        select: { username: true },
      });

      return res.status(201).json({
        message: "Partie créée",
        gameId: game.id,
        fenString: INITIAL_FEN,
        currentGame: {
          id: game.id,
          status: game.status,
          timeControl: game.timeControl,
          player1: { username: p1?.username || "" },
          player2: { username: p2?.username || "" },
        },
      });
    } else {
      return res.json({
        waiting: true,
        message: "En attente d'un adversaire...",
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout à la file d'attente:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

// Retire un utilisateur de la file d'attente
export const removeFromWaitlistController = async (
  req: Request,
  res: Response,
) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    await removeFromWaitlist(userId);
    return res.json({ message: "Vous avez quitté la file d'attente." });
  } catch (error) {
    console.error("Erreur lors du retrait de la file d'attente:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
