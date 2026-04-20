import { Request, Response, NextFunction } from 'express';
import { Schema } from 'zod';

export const validate = (schema: Schema) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({ error: 'Validation Error', details: error.errors });
  }
};
