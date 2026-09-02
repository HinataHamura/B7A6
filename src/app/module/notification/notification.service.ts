import status from 'http-status';
import type { NotificationType } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';

const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  meta?: Record<string, unknown>,
) => {
  return prisma.notification.create({
    data: { userId, type, title, message, meta: meta as object },
  });
};

const getMyNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const markAsRead = async (id: string, userId: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    throw new AppError(status.NOT_FOUND, 'Notification not found');
  }

  if (notification.userId !== userId) {
    throw new AppError(status.FORBIDDEN, 'You cannot modify this notification');
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return null;
};

export const NotificationService = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
