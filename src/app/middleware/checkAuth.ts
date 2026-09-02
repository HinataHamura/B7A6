import status from 'http-status';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyToken } from '../utils/jwt.js';
import type { Role } from '../../generated/prisma/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const checkAuth = (...allowedRoles: Role[]) =>
  catchAsync(async (req, _res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

    if (!token) {
      throw new AppError(status.UNAUTHORIZED, 'You are not authorized');
    }

    const decoded = verifyToken(token, config.jwt.accessSecret);
    const { userId, role } = decoded as { userId: string; role: Role };

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError(status.UNAUTHORIZED, 'User not found');
    }

    if (user.status === 'BLOCKED') {
      throw new AppError(status.FORBIDDEN, 'Your account has been blocked');
    }

    if (user.status === 'DELETED') {
      throw new AppError(status.FORBIDDEN, 'Your account has been deleted');
    }

    if (allowedRoles.length && !allowedRoles.includes(role)) {
      throw new AppError(status.FORBIDDEN, 'You do not have permission to access this resource');
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  });
