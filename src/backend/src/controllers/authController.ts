import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../services/authService';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
	const { email, username, password } = req.body;

	// Validation basique
	if (!email || !username || !password) {
		return res.status(400).json({ error: "Tous les champs sont obligatoires." });
	}

	// Validation de l'email
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return res.status(400).json({ error: "Email invalide." });
	}

	// Validation du mot de passe (6 caractères minimum)
	if (password.length < 6) {
		return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
	}

  try {
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, hashedPassword },
    });
    
    const token = generateToken(user.id, user.email, user.username);
    
    res.status(201).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    // Gestion des erreurs Prisma (ex: email ou username déjà existant)
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return res.status(400).json({ error: "Email ou username déjà utilisé." });
    }
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé." });
    }

    const isPasswordValid = await comparePassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    // Génère un token JWT
    const token = generateToken(user.id, user.email, user.username);

    res.status(200).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
};