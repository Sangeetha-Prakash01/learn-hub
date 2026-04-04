import { Router } from 'express';
import { aiChat } from './ai.controller';
import { optionalAuthMiddleware } from '../../middleware/authMiddleware';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.post('/chat', optionalAuthMiddleware, aiChat);

export default router;
