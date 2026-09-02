import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { PaymentController } from './payment.controller.js';
import { initiatePaymentValidation } from './payment.validation.js';

const router = Router();

router.post(
  '/initiate',
  checkAuth('TENANT'),
  validateRequest(initiatePaymentValidation),
  PaymentController.initiatePayment,
);

router.post('/success/:tranId', PaymentController.paymentSuccess);
router.post('/fail/:tranId', PaymentController.paymentFail);
router.post('/cancel/:tranId', PaymentController.paymentCancel);
router.post('/ipn', PaymentController.paymentIPN);

router.get(
  '/history',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  PaymentController.getPaymentHistory,
);

export const paymentRoutes = router;
