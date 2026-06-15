import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const INITIAL_FEN = 'rn1qkbnr/ppp1pppp/8/3p4/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const toUserId = (value: unknown) => {
	if (typeof value === 'number' && Number.isInteger(value)) {
		return value;
	}

	if (typeof value === 'string' && value.trim() !== '') {
		const parsedValue = Number.parseInt(value, 10);
		return Number.isInteger(parsedValue) ? parsedValue : null;
	}

	return null;
};

// retourne la liste des personnes connectées. On ajustera la requête en fonction de ce qu'on veut afifcher
export const getConnectedUsers = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      username: true,
      eloRating: true,
      avatarUrl: true
    }
  });

  res.json(users);
};

// ajoute un utilisateur à la liste d'attente
export const joinWaitlist = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.sendStatus(401);
  }

  const existing = await prisma.waitlistEntry.findUnique({
    where: { userId }
  });

  if (existing) {
    return res.json({
      waiting: true
    });
  }

  await prisma.waitlistEntry.create({
    data: {
      userId
    }
  });

  // regarde si on peut faire un match
  await tryMatch();

  res.json({
    waiting: true
  });
};

// lance la partie automatiquement si deux joueurs sont dans la liste d'attente
const tryMatch = async () => {
  const players = await prisma.waitlistEntry.findMany({
    take: 2,
    orderBy: {
      createdAt: 'asc'
    }
  });

  if (players.length < 2) {
    return;
  }

  await prisma.game.create({
    data: {
      player1Id: players[0].userId,
      player2Id: players[1].userId,
      fenString: INITIAL_FEN
    }
  });

  await prisma.waitlistEntry.deleteMany({
    where: {
      userId: {
        in: players.map(p => p.userId)
      }
    }
  });
};