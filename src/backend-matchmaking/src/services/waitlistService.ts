// src/backend-matchmaking/services/waitlistService.ts
import prisma from "../prisma";

const WAITLIST_ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * Purgers les utilisateurs qui ne sont plus en ligne
 */
export const cleanInactiveUsers = async () => {
  const cutoff = new Date(Date.now() - WAITLIST_ONLINE_THRESHOLD_MS);

  const staleEntries = await prisma.waitlistEntry.findMany({
    where: {
      OR: [
        { user: { is: { lastSeen: null } } },
        { user: { is: { lastSeen: { lt: cutoff } } } },
      ],
    },
    select: { id: true },
  });

  if (staleEntries.length === 0) {
    return { count: 0 };
  }

  return prisma.waitlistEntry.deleteMany({
    where: {
      id: { in: staleEntries.map((entry) => entry.id) },
    },
  });
};

export const addToWaitlist = async (userId: number) => {
  try {
    const deleted = await cleanInactiveUsers();
    if (deleted.count > 0) {
      console.log(
        `[🧹 Purge opportuniste] ${deleted.count} joueur(s) inactif(s) retiré(s).`,
      );
    }
  } catch (err) {
    console.error("[🧹 Purge] Échec du nettoyage automatique :", err);
  }

  const existing = await prisma.waitlistEntry.findUnique({ where: { userId } });
  if (existing) {
    return existing;
  }

  return prisma.waitlistEntry.create({
    data: { userId },
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
export const findOpponent = async (userId: number) => {
  return await prisma.waitlistEntry.findFirst({
    where: {
      userId: { not: userId },
    },
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
};