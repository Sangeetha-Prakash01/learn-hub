import { Router } from 'express';
import * as ctrl from './subject.controller';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', optionalAuthMiddleware, ctrl.getSubjects);
router.get('/:id', ctrl.getSubjectById);
router.get('/:id/tree', authMiddleware, ctrl.getSubjectTree);
router.get('/:id/first-video', authMiddleware, ctrl.getFirstVideo);
router.post('/', authMiddleware, requireRole(Role.INSTRUCTOR, Role.ADMIN), ctrl.createSubject);
router.patch('/:id/publish', authMiddleware, requireRole(Role.INSTRUCTOR, Role.ADMIN), ctrl.publishSubject);
router.post('/:id/sections', authMiddleware, requireRole(Role.INSTRUCTOR, Role.ADMIN), ctrl.addSection);
router.post('/:id/sections/:sectionId/videos', authMiddleware, requireRole(Role.INSTRUCTOR, Role.ADMIN), ctrl.addVideo);

export default router;
