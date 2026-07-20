// src/backend/src/controllers/lobbyControlller.ts
import { Request, Response } from "express";
import prisma from "../prisma";

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export const getConnectedUsers = async (_req: Request, res: Response) => {
  try {
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const users = await prisma.user.findMany({
      where: {
        lastSeen: {
          gte: cutoff,
        },
      },
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