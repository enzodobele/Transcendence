import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import fs from "fs";

const JWT_SECRET_FILE = process.env.JWT_SECRET_FILE;
if (!JWT_SECRET_FILE || !fs.existsSync(JWT_SECRET_FILE)) {
  console.error("❌ CRITICAL: JWT_SECRET_FILE manquant ou introuvable.");
  process.exit(1);
}

const JWT_SECRET = fs.readFileSync(JWT_SECRET_FILE, "utf8").trim();
if (!JWT_SECRET) {
  console.error("❌ CRITICAL: JWT_SECRET vide.");
  process.exit(1);
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      userId: number;
      username: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "TOKEN_INVALID" });
  }
};
