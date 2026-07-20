import { Request, Response } from "express";
import prisma from "../prisma";

export const getMe = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        currentGame: {
          select: {
            id: true,
            status: true,
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
      return res.status(404).json({ error: "USER_NOT_FOUND" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const { username, email } = req.body;

  if (username === undefined && email === undefined) {
    return res.status(400).json({ error: "NO_FIELDS_TO_UPDATE" });
  }

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  if (username !== undefined && username.trim().length === 0) {
    return res.status(400).json({ error: "USERNAME_EMPTY" });
  }

  const data: Record<string, string> = {};
  if (username !== undefined) data.username = username;
  if (email !== undefined) data.email = email;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, email: true, avatarUrl: true },
    });
    return res.json(user);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res.status(400).json({ error: "EMAIL_OR_USERNAME_TAKEN" });
    }
    console.error("Erreur lors de la mise à jour du profil :", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "GENERIC" });
  }

  const avatarUrl = `/api/auth/uploads/avatars/${req.file.filename}`;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { id: true, username: true, email: true, avatarUrl: true },
    });
    return res.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'avatar :", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

export const heartbeat = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  await prisma.user.update({ where: { id: userId }, data: { lastSeen: new Date() } });
  return res.status(204).send();
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    await prisma.user.delete({ where: { id: userId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Erreur lors de la suppression du compte :", error);
    return res.status(409).json({
      error:
        "Impossible de supprimer ce compte pour le moment : des parties y sont encore liées.",
    });
  }
};
