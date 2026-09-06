import { Router } from 'express';
import { checkAuth } from '../../middleware/checkAuth.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { ListingController } from './listing.controller.js';
import {
  createListingValidation,
  nearbyQueryValidation,
  updateListingValidation,
} from './listing.validation.js';

const router = Router();

router.post(
  '/',
  checkAuth('LANDLORD'),
  validateRequest(createListingValidation),
  ListingController.createListing,
);

router.get('/', ListingController.getAllListings);

router.get(
  '/nearby',
  validateRequest(nearbyQueryValidation),
  ListingController.getNearbyListings,
);

router.get('/my-listings', checkAuth('LANDLORD'), ListingController.getMyListings);

router.get(
  '/dashboard-stats',
  checkAuth('LANDLORD'),
  ListingController.getLandlordDashboardStats,
);

router.get('/:id', ListingController.getListingById);

router.patch(
  '/:id',
  checkAuth('LANDLORD'),
  validateRequest(updateListingValidation),
  ListingController.updateListing,
);

router.delete('/:id', checkAuth('LANDLORD'), ListingController.deleteListing);

router.post('/:id/save', checkAuth('TENANT'), ListingController.toggleSaveListing);

export const listingRoutes = router;
