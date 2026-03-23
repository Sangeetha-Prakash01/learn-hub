import { Request, Response, NextFunction } from 'express';
import * as repo from './subject.repository';
import { getFlatVideoSequence } from '../../utils/ordering';
import prisma from '../../config/db';

export const getSubjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 8;
    const q = req.query.q as string | undefined;
    const includeDrafts = req.query.includeDrafts === 'true';

    let data;
    if (includeDrafts && req.user && (req.user.role === 'ADMIN' || req.user.role === 'INSTRUCTOR')) {
      const instructorId = req.user.role === 'INSTRUCTOR' ? req.user.id : undefined;
      data = await repo.findAll(page, pageSize, q, instructorId, false);
    } else {
      data = await repo.findAllPublished(page, pageSize, q);
    }

    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

export const getSubjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject = await repo.findById(parseInt(req.params.id));
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    let enrolled = false;
    if (req.user) enrolled = await repo.isEnrolled(req.user.id, subject.id);

    res.json({ success: true, subject: { ...subject, enrolled } });
  } catch (err) { next(err); }
};

export const getSubjectTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.id);
    const subject = await repo.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const tree = await repo.findTreeWithProgress(subjectId, req.user?.id);
    res.json({ success: true, subject: { id: subject.id, title: subject.title }, sections: tree });
  } catch (err) { next(err); }
};

export const getFirstVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.id);
    const flat = await getFlatVideoSequence(subjectId);
    if (!flat.length) return res.status(404).json({ success: false, message: 'No videos' });
    res.json({ success: true, videoId: flat[0].id });
  } catch (err) { next(err); }
};

export const createSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, slug, description, thumbnail, price } = req.body;
    
    // Check if slug or title already exists
    const existing = await prisma.subject.findFirst({
      where: { OR: [{ slug }, { title }] },
    });
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: existing.slug === slug ? 'Slug already taken' : 'Course title already exists' 
      });
    }

    const subject = await repo.createSubject({
      title, slug, description, thumbnail, price: parseFloat(price) || 0,
      instructorId: req.user!.id,
    });
    res.status(201).json({ success: true, subject });
  } catch (err) { next(err); }
};

export const publishSubject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    if (userRole !== 'ADMIN' && subject.instructorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this course' });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { isPublished: req.body.isPublished },
    });
    res.json({ success: true, subject: updated });
  } catch (err) { next(err); }
};

export const addSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subjectId = parseInt(req.params.id);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    
    if (userRole !== 'ADMIN' && subject.instructorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to add sections to this course' });
    }

    const { title, orderIndex } = req.body;
    const section = await repo.createSection(subjectId, title, orderIndex);
    res.status(201).json({ success: true, section });
  } catch (err) { next(err); }
};

export const addVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sectionId = parseInt(req.params.sectionId);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const section = await prisma.section.findUnique({ 
      where: { id: sectionId },
      include: { subject: true }
    });
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    
    if (userRole !== 'ADMIN' && section.subject.instructorId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to add videos to this section' });
    }

    const { title, description, youtubeUrl, orderIndex, durationSeconds, isFree } = req.body;
    const video = await repo.createVideo({ sectionId, title, description, youtubeUrl, orderIndex, durationSeconds, isFree });
    res.status(201).json({ success: true, video });
  } catch (err) { next(err); }
};
