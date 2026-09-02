import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { BookingController } from './booking.controller.js';
import { createBookingValidation, updateBookingStatusValidation } from './booking.validation.js';

const router = Router();

router.post(
  '/',
  checkAuth('TENANT'),
  validateRequest(createBookingValidation),
  BookingController.createBooking,
);

router.get('/my-bookings', checkAuth('TENANT'), BookingController.getMyBookingsAsTenant);

router.get(
  '/landlord-bookings',
  checkAuth('LANDLORD'),
  BookingController.getMyBookingsAsLandlord,
);

router.get('/:id', checkAuth('ADMIN', 'LANDLORD', 'TENANT'), BookingController.getBookingById);

router.patch(
  '/:id/status',
  checkAuth('ADMIN', 'LANDLORD', 'TENANT'),
  validateRequest(updateBookingStatusValidation),
  BookingController.updateBookingStatus,
);

export const bookingRoutes = router;
