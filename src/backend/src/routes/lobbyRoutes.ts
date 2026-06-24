import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import {
  getConnectedUsers,
  joinWaitlist,
  removeFromWaitlistController,
} from '../controllers/lobbyControlller';

const router = express.Router();

router.get('/connectedUserList', authenticate, getConnectedUsers);
router.post('/join', authenticate, joinWaitlist);
router.post('/leave', authenticate, removeFromWaitlistController);

export default router;