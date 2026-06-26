// src/backend/src/controllers/lobbyControlller.ts
import { Request, Response } from "express";
import prisma from "../prisma";

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Non autorisé" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        currentGame: {
          select: {
            id: true,
            status: true,
            timeControl: true,
            player1: {
              select: { username: true },
            },
            player2: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getConnectedUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        username: true,
        eloRating: true,
        avatarUrl: true,
      },
    });
    return res.json(users);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des utilisateurs connectés:",
      error,
    );
    return res.status(500).json({ error: "Erreur serveur" });
  }
};
