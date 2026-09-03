import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { AuthController } from './auth.controller.js';
import {
  changePasswordValidation,
  googleLoginValidation,
  loginValidation,
  refreshTokenValidation,
  registerValidation,
} from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerValidation),
  AuthController.register,
);
router.post('/login', authRateLimiter, validateRequest(loginValidation), AuthController.login);
router.post(
  '/google',
  authRateLimiter,
  validateRequest(googleLoginValidation),
  AuthController.googleLogin,
);
router.post(
  '/refresh-token',
  validateRequest(refreshTokenValidation),
  AuthController.refreshToken,
);
router.post(
  '/change-password',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  validateRequest(changePasswordValidation),
  AuthController.changePassword,
);
router.get('/me', checkAuth('ADMIN', 'LANDLORD', 'TENANT'), AuthController.getMe);
router.post('/logout', AuthController.logout);

export const authRoutes = router;
