import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { NotificationService } from './notification.service.js';

const getMyNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.getMyNotifications(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Notifications retrieved successfully',
    data: result,
  });
});

const markAsRead = catchAsync(async (req, res) => {
  const result = await NotificationService.markAsRead(req.params.id as string, req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Notification marked as read',
    data: result,
  });
});

const markAllAsRead = catchAsync(async (req, res) => {
  await NotificationService.markAllAsRead(req.user!.id);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'All notifications marked as read',
    data: null,
  });
});

export const NotificationController = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
