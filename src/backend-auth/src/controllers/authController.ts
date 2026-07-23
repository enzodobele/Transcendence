import { Request, Response } from "express";
import prisma from "../prisma";
import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../services/authService";

export const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  // Validation basique
  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: "REGISTRATION_FAILED" });
  }

  // Validation de l'email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "INVALID_EMAIL" });
  }

  // Validation du mot de passe (6 caractères minimum)
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "PASSWORD_TOO_SHORT" });
  }

  try {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, hashedPassword },
    });

    const token = generateToken(user.id, user.email, user.username, user.isAdmin);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    // Gestion des erreurs Prisma (ex: email ou username déjà existant)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return res.status(400).json({ error: "EMAIL_OR_USERNAME_TAKEN" });
    }
    res.status(500).json({ error: "REGISTRATION_FAILED" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "USER_NOT_FOUND" });
    }

    const isPasswordValid = await comparePassword(
      password,
      user.hashedPassword,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ error: "WRONG_PASSWORD" });
    }

    const token = generateToken(user.id, user.email, user.username, user.isAdmin);

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "LOGIN_FAILED" });
  }
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