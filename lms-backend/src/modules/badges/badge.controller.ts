import { Request, Response } from 'express';
import prisma from '../../config/db';

export const getMyBadges = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true }
    });
    
    return res.json({ success: true, badges: userBadges.map(ub => ({
      ...ub.badge,
      earnedAt: ub.earnedAt
    })) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not fetch badges' });
  }
};

export const getAllBadges = async (req: Request, res: Response) => {
  try {
    const badges = await prisma.badge.findMany();
    return res.json({ success: true, badges });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not fetch badges' });
  }
};
