import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { UserController } from './user.controller.js';
import {
  submitVerificationValidation,
  updateLandlordProfileValidation,
  updateTenantProfileValidation,
} from './user.validation.js';
import type { NextFunction, Request, Response } from 'express';

const router = Router();

const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
  const schema =
    req.user!.role === 'LANDLORD' ? updateLandlordProfileValidation : updateTenantProfileValidation;
  return validateRequest(schema)(req, res, next);
};

router.patch(
  '/me',
  checkAuth('LANDLORD', 'TENANT'),
  validateProfileUpdate,
  UserController.updateMyProfile,
);

router.post(
  '/me/verification',
  checkAuth('TENANT'),
  validateRequest(submitVerificationValidation),
  UserController.submitVerification,
);

router.patch(
  '/verification/:tenantProfileId/review',
  checkAuth('ADMIN'),
  UserController.reviewVerification,
);

export const userRoutes = router;
