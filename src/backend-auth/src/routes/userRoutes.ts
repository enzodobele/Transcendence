import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getMe, updateProfile, uploadAvatar, heartbeat, deleteAccount } from "../controllers/userController";
import { avatarUpload } from "../services/uploadService";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.post("/heartbeat", authenticate, heartbeat);
router.patch("/profile", authenticate, updateProfile);
router.post("/avatar", authenticate, avatarUpload.single("avatar"), uploadAvatar);
router.delete("/me", authenticate, deleteAccount);

export default router;
