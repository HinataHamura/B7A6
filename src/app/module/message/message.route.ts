import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { MessageController } from './message.controller.js';

const router = Router();

router.get(
  '/conversations',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  MessageController.getConversationList,
);

router.get(
  '/unread-count',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  MessageController.getUnreadCount,
);

router.get(
  '/:userId',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  MessageController.getConversation,
);

export const messageRoutes = router;
