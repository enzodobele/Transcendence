import express, { NextFunction, Request, Response } from "express";
import path from "path";
import multer from "multer";
import { register, login } from "./controllers/authController";
import userRoutes from "./routes/userRoutes";

const app = express();
app.use(express.json());

// Point d'entrée Santé
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes d'authentification pures
app.post("/auth/register", register);
app.post("/auth/login", login);

// Routes de gestion du profil utilisateur (identité, avatar)
app.use("/auth", userRoutes);
app.use(
  "/auth/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);

// Gestion propre des erreurs d'upload (type/taille de fichier invalide)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError || err?.message?.includes("non autorisé")) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "SERVER_ERROR" });
});

const PORT = process.env.PORT; // Il écoutera sur le port 3000 dans son conteneur
app.listen(PORT, () => {
  console.log(`🔐 Microservice Auth connecté sur le port ${PORT}`);
});