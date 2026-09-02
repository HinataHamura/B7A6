import { Router } from 'express';
import { authRoutes } from '../module/auth/auth.route.js';
import { bookingRoutes } from '../module/booking/booking.route.js';
import { listingRoutes } from '../module/listing/listing.route.js';
import { paymentRoutes } from '../module/payment/payment.route.js';
import { roommateRoutes } from '../module/roommate/roommate.route.js';
import { reviewRoutes } from '../module/review/review.route.js';
import { messageRoutes } from '../module/message/message.route.js';
import { notificationRoutes } from '../module/notification/notification.route.js';
import { adminRoutes } from '../module/admin/admin.route.js';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
  {
    path: '/admin',
    route: adminRoutes,
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
  {
    path: '/roommates',
    route: roommateRoutes,
  },
  {
    path: '/reviews',
    route: reviewRoutes,
  },
  {
    path: '/messages',
    route: messageRoutes,
  },
  {
    path: '/notifications',
    route: notificationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const routes = router;
