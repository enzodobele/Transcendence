// backend/src/services/jwtService.ts
import jwt from "jsonwebtoken";

// Clé secrète
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET manquant : il doit être fourni par Vault.");
}

export const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { userId, username }, // Payload
    JWT_SECRET, // Clé secrète
    { expiresIn: "24h" }, // Expiration
  );
};

export const verifyToken = (
  token: string,
): { userId: number; username: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
    };
  } catch (error) {
    return null; // Token invalide ou expiré
  }
};
