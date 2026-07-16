// src/backend-matchmaking/services/waitlistService.ts
import prisma from "../prisma";

export const addToWaitlist = async (
  userId: number,
  timeControl: string = "5+0",
) => {
  const existing = await prisma.waitlistEntry.findUnique({ where: { userId } });
  if (existing) {
    return existing;
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

/**
 * Trouve un adversaire disponible sans le supprimer immédiatement.
 */
export const findOpponent = async (userId: number, timeControl: string) => {
  return await prisma.waitlistEntry.findFirst({
    where: {
      userId: { not: userId },
      timeControl,
    },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
};