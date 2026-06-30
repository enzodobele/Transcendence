// src/backend/src/routes/authRoutes.ts
import express from "express";
import { register, login } from "../../../backend-auth/src/controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

export default router;
