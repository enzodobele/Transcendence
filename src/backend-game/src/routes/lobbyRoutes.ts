// src/backend/src/routes/lobbyRoutes.ts
import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getConnectedUsers, getMe } from "../controllers/lobbyControlller";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.get("/connectedUserList", authenticate, getConnectedUsers);

export default router;
