import jwt from "jsonwebtoken";
import * as fs from "fs";

// VÉRIFICATION STRICTE DU SECRET (FAIL-FAST)
if (!process.env.JWT_SECRET_FILE) {
  console.error("❌ CRITICAL ERROR [JWT Service]: La variable JWT_SECRET_FILE n'est pas définie.");
  process.exit(1);
}

if (!fs.existsSync(process.env.JWT_SECRET_FILE)) {
  console.error(`❌ CRITICAL ERROR [JWT Service]: Le fichier secret n'existe pas à l'emplacement : ${process.env.JWT_SECRET_FILE}`);
  process.exit(1);
}

let JWT_SECRET: string;
try {
  JWT_SECRET = fs.readFileSync(process.env.JWT_SECRET_FILE, "utf8").trim();
  if (!JWT_SECRET) {
    throw new Error("Le fichier secret est vide.");
  }
  console.log("✅ [JWT Service] JWT_SECRET chargé avec succès depuis le secret Docker.");
} catch (err: any) {
  console.error(`❌ CRITICAL ERROR [JWT Service]: Impossible de lire le secret JWT : ${err.message}`);
  process.exit(1);
}
// =========================================================================

export const generateToken = (userId: number, username: string): string => {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: "24h" },
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
    return null;
  }
};