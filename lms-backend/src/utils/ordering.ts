import prisma from '../config/db';

export interface FlatVideo {
  id: number;
  title: string;
  sectionId: number;
  orderIndex: number;
  sectionOrderIndex: number;
  isFree: boolean;
  durationSeconds: number | null;
}

export const getFlatVideoSequence = async (subjectId: number): Promise<FlatVideo[]> => {
  const sections = await prisma.section.findMany({
    where: { subjectId },
    orderBy: { orderIndex: 'asc' },
    include: {
      videos: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  const flat: FlatVideo[] = [];
  for (const section of sections) {
    for (const video of section.videos) {
      flat.push({
        id: video.id,
        title: video.title,
        sectionId: video.sectionId,
        orderIndex: video.orderIndex,
        sectionOrderIndex: section.orderIndex,
        isFree: video.isFree,
        durationSeconds: video.durationSeconds,
      });
    }
  }
  return flat;
};

export const getPrerequisiteVideoId = async (
  videoId: number,
  subjectId: number
): Promise<number | null> => {
  const flat = await getFlatVideoSequence(subjectId);
  const idx = flat.findIndex((v) => v.id === videoId);
  if (idx <= 0) return null;
  return flat[idx - 1].id;
};

export const getNextVideoId = async (
  videoId: number,
  subjectId: number
): Promise<number | null> => {
  const flat = await getFlatVideoSequence(subjectId);
  const idx = flat.findIndex((v) => v.id === videoId);
  if (idx === -1 || idx >= flat.length - 1) return null;
  return flat[idx + 1].id;
};

export const isVideoUnlocked = async (
  userId: number,
  videoId: number,
  subjectId: number
): Promise<{ unlocked: boolean; reason?: string }> => {
  const flat = await getFlatVideoSequence(subjectId);
  const video = flat.find((v) => v.id === videoId);

  if (!video) return { unlocked: false, reason: 'Video not found' };
  if (video.isFree) return { unlocked: true };

  const prerequisiteId = await getPrerequisiteVideoId(videoId, subjectId);
  if (!prerequisiteId) return { unlocked: true };

  const progress = await prisma.videoProgress.findUnique({
    where: { userId_videoId: { userId, videoId: prerequisiteId } },
  });

  if (progress?.isCompleted) return { unlocked: true };

  const prereqVideo = await prisma.video.findUnique({
    where: { id: prerequisiteId },
    select: { title: true },
  });

  return {
    unlocked: false,
    reason: `Complete "${prereqVideo?.title || 'previous video'}" first`,
  };
};
