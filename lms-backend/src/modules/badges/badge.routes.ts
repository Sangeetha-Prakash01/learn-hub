import { Router } from 'express';
import { getMyBadges, getAllBadges } from './badge.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

router.get('/my', authMiddleware, getMyBadges);
router.get('/', authMiddleware, getAllBadges);

export default router;
