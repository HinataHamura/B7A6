import { Router } from 'express';
import { authRoutes } from '../module/auth/auth.route.js';
import { listingRoutes } from '../module/listing/listing.route.js';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export const routes = router;
