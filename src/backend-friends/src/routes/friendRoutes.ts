import express from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { sendFriendRequest, getIncomingRequests, acceptFriendRequest, deleteFriendRequest, getFriends } from "../controllers/friendController";

const router = express.Router();

router.get("/",                          authenticate, getFriends);
router.post("/request",                  authenticate, sendFriendRequest);
router.get("/requests",                  authenticate, getIncomingRequests);
router.patch("/requests/:id/accept",     authenticate, acceptFriendRequest);
router.delete("/requests/:id",           authenticate, deleteFriendRequest);

export default router;
