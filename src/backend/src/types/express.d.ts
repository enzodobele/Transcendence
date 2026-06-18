// src/types/express.d.ts

// Ajoute l'utilisateur à l'interface Request d'Express pour pouvoir accéder à req.user dans les contrôleurs
import { JwtPayload } from 'jsonwebtoken';

// Déclare une interface pour le payload JWT + infos utilisateur
interface CustomJwtPayload extends JwtPayload {
  userId: number;
  username: string;
}

// Étend l'interface Request d'Express
declare global {
  namespace Express {
    interface Request {
      user?: CustomJwtPayload; // Ajoute la propriété user
    }
  }
}