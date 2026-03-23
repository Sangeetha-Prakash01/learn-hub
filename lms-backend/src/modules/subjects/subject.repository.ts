import prisma from '../../config/db';
import { isVideoUnlocked } from '../../utils/ordering';

export const findAll = async (page: number, pageSize: number, search?: string, instructorId?: number, onlyPublished = true) => {
  const where: any = {
    ...(onlyPublished ? { isPublished: true } : {}),
    ...(instructorId ? { instructorId } : {}),
    ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
  };

  const [subjects, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        instructor: { select: { name: true } },
        _count: { select: { sections: true, enrollments: true } },
        sections: { include: { _count: { select: { videos: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subject.count({ where }),
  ]);

  return {
    subjects: subjects.map((s) => ({
      ...s,
      totalVideos: s.sections.reduce((acc, sec) => acc + sec._count.videos, 0),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const findAllPublished = (page: number, pageSize: number, search?: string) => 
  findAll(page, pageSize, search, undefined, true);

export const findById = async (id: number) => {
  return prisma.subject.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true } },
      sections: {
        include: {
          videos: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
};

export const findTreeWithProgress = async (subjectId: number, userId?: number) => {
  const sections = await prisma.section.findMany({
    where: { subjectId },
    orderBy: { orderIndex: 'asc' },
    include: {
      videos: { orderBy: { orderIndex: 'asc' } },
    },
  });

  const result = [];
  for (const section of sections) {
    const videos = [];
    for (const video of section.videos) {
      let isCompleted = false;
      let locked = false;
      let unlockReason: string | undefined;

      if (userId) {
        const progress = await prisma.videoProgress.findUnique({
          where: { userId_videoId: { userId, videoId: video.id } },
        });
        isCompleted = progress?.isCompleted ?? false;

        const lockResult = await isVideoUnlocked(userId, video.id, subjectId);
        locked = !lockResult.unlocked;
        unlockReason = lockResult.reason;
      }

      videos.push({
        id: video.id,
        title: video.title,
        orderIndex: video.orderIndex,
        durationSeconds: video.durationSeconds,
        isFree: video.isFree,
        isCompleted,
        locked,
        unlockReason,
      });
    }
    result.push({ id: section.id, title: section.title, orderIndex: section.orderIndex, videos });
  }

  return result;
};

export const isEnrolled = async (userId: number, subjectId: number): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_subjectId: { userId, subjectId } },
  });
  return !!enrollment;
};

export const createSubject = async (data: {
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  price: number;
  instructorId: number;
}) => {
  return prisma.subject.create({ data });
};

export const createSection = async (subjectId: number, title: string, orderIndex?: number) => {
  let finalOrderIndex = orderIndex;
  if (finalOrderIndex === undefined) {
    const last = await prisma.section.findFirst({
      where: { subjectId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    finalOrderIndex = (last?.orderIndex ?? -1) + 1;
  }
  return prisma.section.create({ data: { subjectId, title, orderIndex: finalOrderIndex } });
};

export const createVideo = async (data: {
  sectionId: number;
  title: string;
  description?: string;
  youtubeUrl: string;
  orderIndex?: number;
  durationSeconds?: number;
  isFree?: boolean;
}) => {
  let finalOrderIndex = data.orderIndex;
  if (finalOrderIndex === undefined) {
    const last = await prisma.video.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    finalOrderIndex = (last?.orderIndex ?? -1) + 1;
  }
  return prisma.video.create({ data: { ...data, orderIndex: finalOrderIndex } });
};
