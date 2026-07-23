// backend-auth/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Récupère le token depuis les headers (format: "Bearer <token>")
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }

  // 2. Extrait le token
  const token = authHeader.split(" ")[1];

  // 3. Vérifie et décode le token
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }

  // 4. Ajoute les infos de l'utilisateur à la requête
  req.user = decoded;

  // 5. Passe au contrôleur
  next();
};
