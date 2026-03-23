import { Router } from 'express';
import * as ctrl from './auth.controller';
import { validateBody } from './auth.validator';

const router = Router();

router.post('/register', validateBody('register'), ctrl.register);
router.post('/login', validateBody('login'), ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', ctrl.logout);

export default router;
