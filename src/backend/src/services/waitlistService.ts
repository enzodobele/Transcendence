import prisma from '../prisma';

export const addToWaitlist = async (userId: number, timeControl: string = "5+0") => {
  const existing = await prisma.waitlistEntry.findUnique({ where: { userId } });
  if (existing) {
    throw new Error("L'utilisateur est déjà dans la file d'attente.");
  }

  return prisma.waitlistEntry.create({
    data: { userId, timeControl },
  });
};

export const removeFromWaitlist = async (userId: number) => {
  return prisma.waitlistEntry.deleteMany({
    where: { userId },
  });
};

export const findOpponent = async (userId: number, timeControl: string) => {
  const opponent = await prisma.waitlistEntry.findFirst({
    where: {
      userId: { not: userId },
      timeControl,
    },
    orderBy: { createdAt: 'asc' },
    include: { user: true },
  });

  if (!opponent) {
    return null;
  }

  // Retire les deux joueurs de la file
  await prisma.waitlistEntry.deleteMany({
    where: { userId: { in: [userId, opponent.userId] } },
  });

  return opponent;
};