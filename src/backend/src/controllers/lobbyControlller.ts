import { Request, Response } from 'express';
import prisma from '../prisma';
import { addToWaitlist, removeFromWaitlist, findOpponent } from '../services/waitlistService';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Retourne la liste des utilisateurs connectés (ou actifs)
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
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs connectés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Ajoute un utilisateur à la file d'attente
export const joinWaitlist = async (req: Request, res: Response) => {
  const userId = req.user?.id; // ✅ Utilise req.user.id (et non req.user.userId)

  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    // Vérifie si l'utilisateur est déjà dans la file
    const existing = await prisma.waitlistEntry.findUnique({ where: { userId } });
    if (existing) {
      return res.json({ waiting: true, message: 'Déjà en attente' });
    }

    // Ajoute l'utilisateur à la file
    await addToWaitlist(userId, "5+0"); // ✅ Utilise waitlistService

    // Cherche un adversaire
    const opponent = await findOpponent(userId, "5+0");
    if (opponent) {
      // Crée une partie en base de données
      const game = await prisma.game.create({
        data: {
          player1Id: userId,
          player2Id: opponent.userId,
          fenString: INITIAL_FEN,
          timeControl: "5+0",
          status: "en_cours",
        },
      });

      // Retire les deux joueurs de la file
      await removeFromWaitlist(userId);
      await removeFromWaitlist(opponent.userId);

      return res.status(201).json({
        message: 'Partie créée',
        gameId: game.id,
        opponent: opponent.user,
        fenString: INITIAL_FEN,
      });
    } else {
      return res.json({ waiting: true, message: 'En attente d\'un adversaire...' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la file d\'attente:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Retire un utilisateur de la file d'attente
export const removeFromWaitlistController = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    await removeFromWaitlist(userId);
    return res.json({ message: 'Vous avez quitté la file d\'attente.' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la file d\'attente:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};