import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { RoommateController } from './roommate.controller.js';
import {
  respondRoommateRequestValidation,
  sendRoommateRequestValidation,
} from './roommate.validation.js';

const router = Router();

router.get('/matches', checkAuth('TENANT'), RoommateController.findMatches);

router.post(
  '/requests',
  checkAuth('TENANT'),
  validateRequest(sendRoommateRequestValidation),
  RoommateController.sendRequest,
);

router.get('/requests/sent', checkAuth('TENANT'), RoommateController.getSentRequests);
router.get('/requests/received', checkAuth('TENANT'), RoommateController.getReceivedRequests);

router.patch(
  '/requests/:id/respond',
  checkAuth('TENANT'),
  validateRequest(respondRoommateRequestValidation),
  RoommateController.respondToRequest,
);

router.patch('/requests/:id/cancel', checkAuth('TENANT'), RoommateController.cancelRequest);

export const roommateRoutes = router;
