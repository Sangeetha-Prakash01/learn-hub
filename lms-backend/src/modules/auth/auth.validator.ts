import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const schemas = {
  register: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
  }),
  login: z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
  }),
};

export const validateBody =
  (schema: keyof typeof schemas) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schemas[schema].safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }
    req.body = result.data;
    next();
  };
