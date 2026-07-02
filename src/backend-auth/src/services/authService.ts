import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

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
): string => {
  const token = jwt.sign({ userId, email, username }, JWT_SECRET, {
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
