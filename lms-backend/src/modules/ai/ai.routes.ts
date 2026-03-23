import { Router } from 'express';
import { aiChat } from './ai.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.post('/chat', authMiddleware, aiChat);

export default router;
