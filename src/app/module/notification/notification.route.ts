import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { NotificationController } from './notification.controller.js';

const router = Router();

router.get(
  '/',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  NotificationController.getMyNotifications,
);

router.patch(
  '/read-all',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  NotificationController.markAllAsRead,
);

router.patch(
  '/:id/read',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  NotificationController.markAsRead,
);

export const notificationRoutes = router;
