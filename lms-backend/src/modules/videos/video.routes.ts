import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { authMiddleware } from '../../middleware/authMiddleware';
import { isVideoUnlocked, getPrerequisiteVideoId, getNextVideoId } from '../../utils/ordering';

const getVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const userId = req.user!.id;

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        section: {
          include: {
            subject: { select: { id: true, title: true, price: true, instructorId: true } },
          },
        },
      },
    });

    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    const subjectId = video.section.subjectId;
    const subject = video.section.subject;
    const isOwner = subject.instructorId === userId;
    const isAdmin = req.user!.role === 'ADMIN';

    // Enrollment check for paid courses
    if (Number(subject.price) > 0 && !video.isFree && !isOwner && !isAdmin) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_subjectId: { userId, subjectId } },
      });
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'Enroll in this course to access this video',
          requiresEnrollment: true,
          subjectId,
        });
      }
    }

    const { unlocked, reason } = await isVideoUnlocked(userId, videoId, subjectId);
    const previousVideoId = await getPrerequisiteVideoId(videoId, subjectId);
    const nextVideoId = await getNextVideoId(videoId, subjectId);

    res.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        description: video.description,
        youtubeUrl: unlocked ? video.youtubeUrl : null,
        orderIndex: video.orderIndex,
        durationSeconds: video.durationSeconds,
        isFree: video.isFree,
        sectionId: video.sectionId,
        sectionTitle: video.section.title,
        subjectId,
        subjectTitle: subject.title,
        previousVideoId,
        nextVideoId,
        locked: !unlocked,
        unlockReason: reason,
      },
    });
  } catch (err) {
    next(err);
  }
};

const router = Router();
router.get('/:videoId', authMiddleware, getVideo);

export default router;
