import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { AdminController } from './admin.controller.js';
import { updateUserStatusValidation } from './admin.validation.js';

const router = Router();

router.get('/users', checkAuth('ADMIN'), AdminController.getAllUsers);

router.patch(
  '/users/:id/status',
  checkAuth('ADMIN'),
  validateRequest(updateUserStatusValidation),
  AdminController.updateUserStatus,
);

router.patch(
  '/landlords/:id/verify',
  checkAuth('ADMIN'),
  AdminController.verifyLandlord,
);

router.get('/stats', checkAuth('ADMIN'), AdminController.getDashboardStats);

export const adminRoutes = router;
