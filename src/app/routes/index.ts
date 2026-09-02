import { Router } from 'express';
import { authRoutes } from '../module/auth/auth.route.js';
import { bookingRoutes } from '../module/booking/booking.route.js';
import { listingRoutes } from '../module/listing/listing.route.js';
import { paymentRoutes } from '../module/payment/payment.route.js';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/listings',
    route: listingRoutes,
  },
  {
    path: '/bookings',
    route: bookingRoutes,
  },
  {
    path: '/payments',
    route: paymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const routes = router;
