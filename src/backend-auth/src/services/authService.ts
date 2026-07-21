import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as fs from "fs"; // 👈 Obligatoire pour lire le secret Docker

// =========================================================================
// 🚨 VÉRIFICATION STRICTE DU SECRET (FAIL-FAST)
// =========================================================================
if (!process.env.JWT_SECRET_FILE) {
  console.error("❌ CRITICAL ERROR [Auth Service]: La variable JWT_SECRET_FILE n'est pas définie.");
  process.exit(1);
}

if (!fs.existsSync(process.env.JWT_SECRET_FILE)) {
  console.error(`❌ CRITICAL ERROR [Auth Service]: Le fichier secret n'existe pas à l'emplacement : ${process.env.JWT_SECRET_FILE}`);
  process.exit(1);
}

let JWT_SECRET: string;
try {
  JWT_SECRET = fs.readFileSync(process.env.JWT_SECRET_FILE, "utf8").trim();
  if (!JWT_SECRET) {
    throw new Error("Le fichier secret est vide.");
  }
  console.log("✅ [Auth Service] JWT_SECRET chargé avec succès depuis le secret Docker.");
} catch (err: any) {
  console.error(`❌ CRITICAL ERROR [Auth Service]: Impossible de lire le secret JWT : ${err.message}`);
  process.exit(1);
}
// =========================================================================

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (
  userId: number,
  email: string,
  username: string,
  isAdmin: boolean = false,
): string => {
  const token = jwt.sign({ userId, email, username, isAdmin }, JWT_SECRET, {
    expiresIn: "24h",
  });
  return token;
};

export const verifyToken = (
  token: string,
): (jwt.JwtPayload & { userId: number; username: string; email: string }) | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      userId: number;
      username: string;
      email: string;
    };
  } catch {
    return null;
  }
};