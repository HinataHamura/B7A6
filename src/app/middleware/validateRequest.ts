import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { catchAsync } from '../utils/catchAsync.js';

export const validateRequest = (schema: AnyZodObject) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body;
    next();
  });
