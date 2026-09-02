import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/index.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/AppError.js';

interface IErrorSource {
  path: string | number;
  message: string;
}

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorSources: IErrorSource[] = [{ path: '', message: 'Something went wrong' }];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
      errorSources = [{ path: '', message: (err.meta?.cause as string) || 'Not found' }];
    } else if (err.code === 'P2002') {
      statusCode = 409;
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      message = 'Duplicate entry';
      errorSources = [{ path: target, message: `${target} already exists` }];
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference';
      errorSources = [{ path: '', message: 'Related resource does not exist' }];
    } else {
      statusCode = 400;
      message = err.message;
      errorSources = [{ path: '', message: err.message }];
    }
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: errorSources,
    stack: config.env === 'development' ? (err as Error)?.stack : undefined,
  });
};
