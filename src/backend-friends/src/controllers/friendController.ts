import { Request, Response } from "express";
import prisma from "../prisma";

// POST /friends/request  — Envoyer une demande d'ami
export const sendFriendRequest = async (req: Request, res: Response) => {
  const senderId = req.user?.userId;
  if (!senderId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: "USERNAME_EMPTY" });

  try {
    const receiver = await prisma.user.findUnique({
      where: { username: username.trim() },
      select: { id: true, username: true },
    });
    if (!receiver) return res.status(404).json({ error: "USER_NOT_FOUND" });
    if (receiver.id === senderId) return res.status(400).json({ error: "CANNOT_ADD_SELF" });

    // Déjà amis ?
    const [u1, u2] = senderId < receiver.id ? [senderId, receiver.id] : [receiver.id, senderId];
    const alreadyFriend = await prisma.friend.findUnique({ where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } } });
    if (alreadyFriend) return res.status(409).json({ error: "ALREADY_FRIENDS" });

    // Demande déjà envoyée ?
    const alreadySent = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId: receiver.id } },
    });
    if (alreadySent) return res.status(409).json({ error: "REQUEST_ALREADY_SENT" });

    // La cible nous a déjà envoyé une demande → on accepte directement
    const reverse = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: receiver.id, receiverId: senderId } },
    });
    if (reverse) {
      await prisma.$transaction([
        prisma.friendRequest.delete({ where: { id: reverse.id } }),
        prisma.friend.create({ data: { user1Id: u1, user2Id: u2 } }),
      ]);
      return res.status(201).json({ message: "FRIEND_REQUEST_ACCEPTED" });
    }

    await prisma.friendRequest.create({ data: { senderId, receiverId: receiver.id } });
    return res.status(201).json({ message: "FRIEND_REQUEST_SENT" });
  } catch (error) {
    console.error("Erreur sendFriendRequest:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// GET /friends/requests  — Demandes reçues en attente
export const getIncomingRequests = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: userId },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(requests.map((r) => ({ id: r.id, sender: r.sender, createdAt: r.createdAt })));
  } catch (error) {
    console.error("Erreur getIncomingRequests:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// PATCH /friends/requests/:id/accept  — Accepter une demande
export const acceptFriendRequest = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const requestId = parseInt(req.params.id);
  if (isNaN(requestId)) return res.status(400).json({ error: "INVALID_ID" });

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
    if (request.receiverId !== userId) return res.status(403).json({ error: "UNAUTHORIZED" });

    const [u1, u2] = request.senderId < request.receiverId
      ? [request.senderId, request.receiverId]
      : [request.receiverId, request.senderId];

    await prisma.$transaction([
      prisma.friendRequest.delete({ where: { id: requestId } }),
      prisma.friend.create({ data: { user1Id: u1, user2Id: u2 } }),
    ]);
    return res.json({ message: "FRIEND_REQUEST_ACCEPTED" });
  } catch (error) {
    console.error("Erreur acceptFriendRequest:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

// DELETE /friends/requests/:id  — Refuser ou annuler une demande
export const deleteFriendRequest = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  const requestId = parseInt(req.params.id);
  if (isNaN(requestId)) return res.status(400).json({ error: "INVALID_ID" });

  try {
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: "REQUEST_NOT_FOUND" });
    if (request.senderId !== userId && request.receiverId !== userId) return res.status(403).json({ error: "UNAUTHORIZED" });

    await prisma.friendRequest.delete({ where: { id: requestId } });
    return res.json({ message: "FRIEND_REQUEST_DELETED" });
  } catch (error) {
    console.error("Erreur deleteFriendRequest:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};

const ONLINE_THRESHOLD_MS = 60 * 1000; // 2 minutes

// GET /friends  — Liste des amis acceptés avec statut en ligne
export const getFriends = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: "UNAUTHORIZED" });

  try {
    const rows = await prisma.friend.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      include: {
        user1: { select: { id: true, username: true, avatarUrl: true, lastSeen: true } },
        user2: { select: { id: true, username: true, avatarUrl: true, lastSeen: true } },
      },
    });
    const now = Date.now();
    const friends = rows.map((f) => {
      const u = f.user1Id === userId ? f.user2 : f.user1;
      return {
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        isOnline: u.lastSeen ? now - u.lastSeen.getTime() < ONLINE_THRESHOLD_MS : false,
      };
    });
    return res.json(friends);
  } catch (error) {
    console.error("Erreur getFriends:", error);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
};
