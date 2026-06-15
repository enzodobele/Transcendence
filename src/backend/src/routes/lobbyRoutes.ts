import express from 'express';
import { authenticate } from '../middlewares/authMiddleware';
import { getConnectedUsers, joinWaitlist } from '../controllers/lobbyControlller';

const router = express.Router();

router.get('/connectedUserList', authenticate, getConnectedUsers);
router.post('/waitlist', authenticate, joinWaitlist);

export default router;