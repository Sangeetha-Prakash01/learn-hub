import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../../config/db';
import { authMiddleware } from '../../middleware/authMiddleware';

const getVideoProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const userId = req.user!.id;

    const progress = await prisma.videoProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });

    res.json({
      success: true,
      progress: {
        lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
        isCompleted: progress?.isCompleted ?? false,
      },
    });
  } catch (err) { next(err); }
};

const updateVideoProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const videoId = parseInt(req.params.videoId);
    const userId = req.user!.id;
    let { lastPositionSeconds, isCompleted } = req.body;

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    // Cap position
    lastPositionSeconds = Math.max(0, lastPositionSeconds);
    if (video.durationSeconds) {
      lastPositionSeconds = Math.min(lastPositionSeconds, video.durationSeconds);
    }

    const progress = await prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: {
        lastPositionSeconds,
        ...(isCompleted ? { isCompleted: true, completedAt: new Date() } : {}),
      },
      create: {
        userId,
        videoId,
        lastPositionSeconds,
        isCompleted: isCompleted ?? false,
        ...(isCompleted ? { completedAt: new Date() } : {}),
      },
    });

    res.json({ success: true, progress });
  } catch (err) { next(err); }
};

const getSubjectProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.subjectId);
    const userId = req.user!.id;

    const sections = await prisma.section.findMany({
      where: { subjectId },
      include: { videos: { select: { id: true } } },
    });

    const allVideoIds = sections.flatMap((s) => s.videos.map((v) => v.id));
    const totalVideos = allVideoIds.length;

    const completedProgress = await prisma.videoProgress.findMany({
      where: { userId, videoId: { in: allVideoIds }, isCompleted: true },
    });

    const completedVideos = completedProgress.length;
    const percentComplete = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    // Last watched
    const lastProgress = await prisma.videoProgress.findFirst({
      where: { userId, videoId: { in: allVideoIds } },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      progress: {
        totalVideos,
        completedVideos,
        percentComplete,
        lastVideoId: lastProgress?.videoId ?? null,
        lastPositionSeconds: lastProgress?.lastPositionSeconds ?? 0,
      },
    });
  } catch (err) { next(err); }
};

const router = Router();
router.get('/subjects/:subjectId', authMiddleware, getSubjectProgress);
router.get('/videos/:videoId', authMiddleware, getVideoProgress);
router.post('/videos/:videoId', authMiddleware, updateVideoProgress);

export default router;
