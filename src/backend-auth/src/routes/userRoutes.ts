import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { getMe, updateProfile, uploadAvatar } from "../controllers/userController";
import { avatarUpload } from "../services/uploadService";

const router = express.Router();

router.get("/me", authenticate, getMe);
router.patch("/profile", authenticate, updateProfile);
router.post("/avatar", authenticate, avatarUpload.single("avatar"), uploadAvatar);

export default router;
