import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../services/authService';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  try {
	const hashedPassword = await hashPassword(password); // Plus besoin de déstructurer `salt`
	const user = await prisma.user.create({
	data: {
		email,
		username,
		hashedPassword, // Ici, `hashedPassword` est une string
	},
	});
    res.status(201).json({ userId: user.id, username: user.username });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de l'inscription" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    res.status(200).json({ userId: user.id, username: user.username });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la connexion" });
  }
};