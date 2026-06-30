import express, { Request, Response } from "express";
import { register, login } from "./controllers/authController";

const app = express();
app.use(express.json());

// Point d'entrée Santé
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes d'authentification pures
app.post("/auth/register", register);
app.post("/auth/login", login);

const PORT = process.env.PORT || 3000; // Il écoutera sur le port 3000 dans son conteneur
app.listen(PORT, () => {
  console.log(`🔐 Microservice Auth connecté sur le port ${PORT}`);
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});